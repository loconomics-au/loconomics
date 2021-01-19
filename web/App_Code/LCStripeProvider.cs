using LcRest;
using Stripe;
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
            countryCode = LcRest.Locale.Current.countryCode
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
        var mechantAccount = service.Get(paymentAccount.stripeNumber);

        paymentAccount.status = mechantAccount.DetailsSubmitted ? "active" : "pending";

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
}