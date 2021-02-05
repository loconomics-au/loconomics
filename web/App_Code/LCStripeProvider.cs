using LcRest;
using Stripe;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.Threading;
using WebMatrix.WebData;

/// <summary>
/// Summary description for LCStripeProvider
/// </summary>
public class LCStripeProvider
{
    private readonly string apiKey = "";
    private readonly string refreshUrl = "";
    private readonly string returnUrl = "";

    public static string PublicKey = ConfigurationManager.AppSettings["Stripe.PublicKey"];

    public LCStripeProvider()
    {
        apiKey = ConfigurationManager.AppSettings["Stripe.ApiKey"];
        
        refreshUrl = ConfigurationManager.AppSettings["Stripe.RefreshUrl"];
        returnUrl = ConfigurationManager.AppSettings["Stripe.ReturnUrl"];
    }

    public AccountLink OnboardUserAccount()
    {
        var userProfile = UserProfile.Get(WebSecurity.CurrentUserId);
        StripeConfiguration.ApiKey = apiKey;

        var options = new AccountCreateOptions
        {
            Type = "standard",
            Email = userProfile.email,
            Country = Locale.Current.countryCode,
            BusinessType = "individual",
            Individual = new AccountIndividualOptions() { FirstName = userProfile.firstName, LastName = userProfile.lastName,
                Email = userProfile.email },
        };

        var service = new AccountService();
        var merchantAccount = service.Create(options);


        // save stripe account to db
        var data = new LcRest.PaymentAccount
        {
            userID = WebSecurity.CurrentUserId,
            firstName = merchantAccount.Individual.FirstName,
            lastName = merchantAccount.Individual.LastName,
            stripeNumber = merchantAccount.Id,
            countryCode = Locale.Current.countryCode
        };

        SetPaymentAccount(data);

        var linkOptions = new AccountLinkCreateOptions
        {
            Account = merchantAccount.Id,
            RefreshUrl = refreshUrl,
            ReturnUrl = returnUrl,
            Type = "account_onboarding",
        };
        var linkService = new AccountLinkService();
        var accountLink = linkService.Create(linkOptions);

        return accountLink;
    }

    public void UpdateStatus()
    {
        var service = new AccountService();
        var paymentAccount = GetPaymentAccount(WebSecurity.CurrentUserId);

        if (string.IsNullOrEmpty(paymentAccount.stripeNumber))
        {
            using (var logger = new LcLogger("StripeProvider"))
            {
                logger.Log("Connected Account:: No MerchantAccountID for UserID: {0}", WebSecurity.CurrentUserId);
                logger.Save();
            }
            return;
        }
        var merchantAccount = service.Get(paymentAccount.stripeNumber);

        if (merchantAccount == null)
        {
            using (var logger = new LcLogger("StripeProvider"))
            {
                logger.Log("Connected Account:: Impossible to get the provider account from MerchantAccountID: {0}", paymentAccount.stripeNumber);                
                logger.Save();
            }
            return;
        }

        paymentAccount.status = merchantAccount.DetailsSubmitted ? "active" : "pending";

        SetPaymentAccount(paymentAccount);
    }

    #region payment accounts
    public PaymentAccount GetPaymentAccount(int userID)
    {
        var account = LcData.GetProviderPaymentAccount(userID);
        var userProfile = UserProfile.Get(WebSecurity.CurrentUserId);

        if (account != null)
        {
            return new PaymentAccount()
            {
                userID = userID,
                status = account.status,
                email = userProfile.email,
                stripeNumber = account.merchantAccountId,
                isStripe = true,
                isVenmo = false
            };
            
        }

        return null;
    }

    public void SetPaymentAccount(PaymentAccount account)
    {
        // save to local DB
        LcData.SetProviderPaymentAccount(
            account.userID,
            account.stripeNumber,
            account.status,
            null,
            null,
            null,
            "stripe"
        );
    }
    #endregion

    #region MarketPlace
    public const string MarketplaceProviderFee = "1.75% plus $0.30";
    #endregion

    #region Payments
    /// <summary>
    /// Put a hold on a payment, to be collected at a later date
    /// </summary>
    /// <param name="totalPrice">The amount of the transaction</param>
    /// <param name="serviceProfessionalUserID">The ID of the service professional to pay</param>
    /// <param name="paymentData">The data of the payment submitted by the client</param>
    /// <param name="validationResults">Any errors that occur during payment</param>
    /// <returns></returns>
    public LcPayment.PaymentInfo CollectPayment(decimal? totalPrice, int serviceProfessionalUserID, LcPayment.InputPaymentMethod paymentData, out Dictionary<string, string> validationResults)
    {
        LcPayment.PaymentInfo paymentInfo = null;
        validationResults = null;
        string stripeAccountID = String.Empty;


        var paymentAccount = LcData.GetProviderPaymentAccount(serviceProfessionalUserID);
        if (paymentAccount != null)
        {
            stripeAccountID = paymentAccount.MerchantAccountID;
        }

        StripeConfiguration.ApiKey = apiKey;

        var service = new PaymentIntentService();

        RegionInfo region = new RegionInfo(System.Threading.Thread.CurrentThread.CurrentCulture.LCID);
        var createOptions = new PaymentIntentCreateOptions
        {
            Amount = totalPrice.Value.ToMinorUnit(),
            Currency = region.ISOCurrencySymbol.ToLower(),
            
            PaymentMethodTypes = new List<string>
                {
                    "card",
                },
            PaymentMethod = paymentData.paymentMethodID,
            ConfirmationMethod = "manual",
            CaptureMethod = "manual",
        };

        var requestOptions = new RequestOptions();
        requestOptions.StripeAccount = stripeAccountID.ToString();
        PaymentIntent intent = service.Create(createOptions, requestOptions);

        paymentInfo = new LcPayment.PaymentInfo()
        {
            // We have a valid payment ID at this moment, save it on the booking
            PaymentMethodID = paymentData.paymentMethodID,
            // Set card number (is processed later while saving to ensure only 4 and encrypted are persisted)
            PaymentLastFourCardNumberDigits = paymentData.cardNumber,
            // Flags
            PaymentCollected = false,
            PaymentAuthorized = true,
            // save transaction id (payment intent)
            PaymentTransactionID = intent.Id,
            CancellationPaymentTransactionID = null
        };

        return paymentInfo;
    }

    /// <summary>
    /// Authorize a transaction can occur. No charge occurs
    /// </summary>
    /// <param name="serviceProfessionalUserID">The ID of the service professional to pay</param>
    /// <param name="paymentTransactionID">The Stripe transaction ID</param>
    /// <param name="paymentAuthorized">Is payment autorized on this booking?</param>
    /// <returns>true if the transaction can occur</returns>
    public bool AuthorizeTransaction(int serviceProfessionalUserID, string paymentTransactionID, out bool paymentAuthorized)
    {
        paymentAuthorized = false;
        string stripeAccountID = String.Empty;
        var paymentAccount = LcData.GetProviderPaymentAccount(serviceProfessionalUserID);
        if (paymentAccount != null)
        {
            stripeAccountID = paymentAccount.MerchantAccountID;
        }

        var service = new PaymentIntentService();
        var confirmOptions = new PaymentIntentConfirmOptions { };

        var requestOptions = new RequestOptions();
        requestOptions.StripeAccount = stripeAccountID.ToString();
        PaymentIntent intent = service.Confirm(paymentTransactionID, confirmOptions, requestOptions);

        if (intent.Status == "succeeded")
        {
            paymentAuthorized = true;
        }
        else
        {
            // TODO impliment re-auth by client if credit card requires it
            throw new Exception(intent.Status);
        }
        return true;
    }

    /// <summary>
    /// Submit a transaction to transfer the full amount to the service professionals account
    /// </summary>
    /// <param name="serviceProfessionalUserID">The ID of the service professional to pay</param>
    /// <param name="paymentTransactionID">The Stripe transaction ID</param>
    /// <returns></returns>
    public string SettleTransaction(int serviceProfessionalUserID, string paymentTransactionID)
    {
        string errorMessage = String.Empty;
        string stripeAccountID = String.Empty;

        var paymentAccount = LcData.GetProviderPaymentAccount(serviceProfessionalUserID);
        if (paymentAccount != null)
        {
            stripeAccountID = paymentAccount.MerchantAccountID;
        }

        var service = new PaymentIntentService();
        var captureOptions = new PaymentIntentCaptureOptions { };

        var requestOptions = new RequestOptions();
        requestOptions.StripeAccount = stripeAccountID.ToString();
        PaymentIntent intent = service.Capture(paymentTransactionID, captureOptions, requestOptions);

        if (intent.Status != "succeeded")
        {
            errorMessage = intent.Status;
        }

        return errorMessage;
    }

    /// <summary>
    /// Stripe does not support releasing payments to connected accounts
    /// </summary>
    /// <param name="transactionID"></param>
    /// <returns></returns>
    public string ReleaseTransaction(string transactionID)
    {
        string errorMessage = String.Empty;

        return errorMessage;
    }
    #endregion
}