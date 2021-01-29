﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;
using Braintree;
using System.Web.WebPages;
using LcRest;

/// <summary>
/// Descripción breve de LcPayment
/// </summary>
public static partial class LcPayment
{
    #region Gateway and config
    public static BraintreeGateway NewBraintreeGateway(BraintreeGateway gateway)
    {
        return gateway == null ? NewBraintreeGateway() : gateway;
    }
    public static BraintreeGateway NewBraintreeGateway()
    {
        BraintreeGateway gateway;
        if (ConfigurationManager.AppSettings["Braintree.InSandbox"].AsBool()) {
            //SandBox API keys for testing
            gateway = new BraintreeGateway
            {
                Environment = Braintree.Environment.SANDBOX,
                MerchantId = ConfigurationManager.AppSettings["Braintree.Sandbox.MerchantId"],
                PublicKey = ConfigurationManager.AppSettings["Braintree.Sandbox.PublicKey"],
                PrivateKey = ConfigurationManager.AppSettings["Braintree.Sandbox.PrivateKey"]
            };
        } else {
            gateway = new BraintreeGateway
            {
                Environment = Braintree.Environment.PRODUCTION,
                MerchantId = ConfigurationManager.AppSettings["Braintree.Production.MerchantId"],
                PublicKey = ConfigurationManager.AppSettings["Braintree.Production.PublicKey"],
                PrivateKey = ConfigurationManager.AppSettings["Braintree.Production.PrivateKey"]
            };
        }
        return gateway;
    }
    public static string BraintreeJsEnvironment
    {
        get
        {
            return ConfigurationManager.AppSettings["Braintree.InSandbox"].AsBool()
                ? "sandbox"
                : "production";
        }
    }
    public static string BraintreeMerchantId
    {
        get
        {
            return ConfigurationManager.AppSettings["Braintree.InSandbox"].AsBool()
                ? ConfigurationManager.AppSettings["Braintree.Sandbox.MerchantId"]
                : ConfigurationManager.AppSettings["Braintree.Production.MerchantId"];
        }
    }
    public static string BraintreeMerchantAccountId
    {
        get
        {
            return ConfigurationManager.AppSettings["Braintree.InSandbox"].AsBool()
                ? ConfigurationManager.AppSettings["Braintree.Sandbox.MerchantAccountId"]
                : ConfigurationManager.AppSettings["Braintree.Production.MerchantAccountId"];
        }
    }
    public static bool BraintreeFraudProtectionToolsEnabled
    {
        get
        {
            return ConfigurationManager.AppSettings["Braintree.FraudProtectionTools.Enabled"].AsBool();
        }
    }

    /// <summary>
    /// The emulation allows to shortcut Braintree, for local dev environments where is
    /// not possible even to use Braintree Sandbox
    /// </summary>
    public static readonly bool TESTING_EMULATEBRAINTREE = ASP.LcHelpers.Channel == "localdev";
    #endregion

    #region Actions: Create or prepare transactions and cards

    /// <summary>
    /// Performs a transaction to authorize the payment on the client payment method, but
    /// not charging still, using the data from the given booking and the saved paymentMethodID.
    /// Booking is NOT checked before perform the task, use the LcRest.Booking API to securely run pre-condition
    /// checks before authorize transaction. The booking must have the data loaded for the pricingSummary.
    /// 
    /// REVIEWED #771
    /// </summary>
    /// <param name="booking"></param>
    /// <param name="paymentMethodID">AKA creditCardToken</param>
    /// <returns>It returns the transactionID generated, original booking object is not updated.
    /// Errors in the process are throwed.</returns>
    public static string AuthorizeBookingTransaction(LcRest.Booking booking)
    {
        if (booking.pricingSummary == null ||
            !booking.pricingSummary.totalPrice.HasValue ||
            booking.pricingSummary.totalPrice.Value <= 0)
        {
            throw new ConstraintException("To authorize a booking payment is required a price to charge.");
        }

        var gateway = NewBraintreeGateway();

        TransactionRequest request = new TransactionRequest
        {
            Amount = booking.pricingSummary.totalPrice.Value,
            // Marketplace #408: since provider receive the money directly, Braintree must discount
            // the next amount in concept of fees and pay that to the Marketplace Owner (us, Loconomics ;-)
            ServiceFeeAmount = booking.pricingSummary.serviceFeeAmount,
            CustomerId = GetCustomerId(booking.clientUserID),
            PaymentMethodToken = booking.paymentMethodID,
            // Now, with Marketplace #408, the receiver of the money for each transaction is
            // the provider through account at Braintree, and not the Loconomics account:
            //MerchantAccountId = LcPayment.BraintreeMerchantAccountId,
            MerchantAccountId = GetProviderPaymentAccountId(booking.serviceProfessionalUserID),
            Options = new TransactionOptionsRequest
            {
                // Marketplace #408: don't pay provider still, wait for the final confirmation 'release scrow'
                HoldInEscrow = true,
                // Do not submit, just authorize:
                SubmitForSettlement = false
            }
        };

        var r = gateway.Transaction.Sale(request);

        // Everything goes fine
        if (r.IsSuccess())
        {
            // Get the transactionID
            if (r.Target != null
                && !String.IsNullOrEmpty(r.Target.Id))
            {
                // If the card is a TEMPorarly card (just to perform this transaction)
                // it must be removed now since was successful used
                // IMPORTANT: Since an error on this subtask is not important to the
                // user and will break a success process creating a new problem if throwed (because transactionID
                // gets lost),
                // is catched and managed internally by Loconomics stuff that can check and fix transparentely
                // this minor error.
                try
                {
                    if (booking.paymentMethodID.StartsWith(TempSavedCardPrefix))
                        gateway.CreditCard.Delete(booking.paymentMethodID);
                }
                catch (Exception ex)
                {
                    try
                    {
                        LcMessaging.NotifyError(String.Format("LcPayment.AuthorizeBookingTransaction..DeleteBraintreeTempCard({0});bookingID={1}", booking.paymentMethodID, booking.bookingID), "", ex.Message);
                        LcLogger.LogAspnetError(ex);
                    }
                    catch { }
                }

                // r.Target.Id => transactionID
                return r.Target.Id;
            }
            else
            {
                // Transaction worked but impossible to know the transactionID (weird, is even possible?),
                // notify error
                throw new Exception("Impossible to know transaction details, please contact support. BookingID #" + booking.bookingID.ToString());
            }
        }
        else
        {
            throw new Exception(r.Message);
        }
    }

    /// <summary>
    /// Request an immediate transaction for the booking cancellation fee, if any
    /// (cancellation must be previously calculated on the booking, with amounts at pricing totalPrice and serviceFeeAmount, as usual).
    /// It manages when there is no price to charge, and just skip the step without error.
    /// The removal of a temporary card is performed after all (doesn't matter if a transaction was needed or not).
    /// The transaction is "immediate" because is asked to be submitted and released now (the flow 
    /// for a normal booking payment is to authorize, later settle, later release, but on this case
    /// we require to Braintree to do all that steps at the moment).
    /// 
    /// REVIEWED #771
    /// </summary>
    /// <param name="booking"></param>
    /// <returns>It returns the transactionID generated, original booking object is not updated.
    /// Errors in the process are throwed.</returns>
    public static string BookingCancellationPaymentFromCard(LcRest.Booking booking)
    {
        string cancellationTransactionID = null;
        var gateway = NewBraintreeGateway();

        if (booking.pricingSummary.totalPrice.HasValue && booking.pricingSummary.totalPrice > 0)
        {
            if (String.IsNullOrEmpty(booking.paymentMethodID))
                throw new ConstraintException("Cannot charge booking cancellation fee because there is no payment method.");

            TransactionRequest request = new TransactionRequest
            {
                Amount = booking.pricingSummary.totalPrice.Value,
                // Marketplace #408: since provider receive the money directly, Braintree must discount
                // the next amount in concept of fees and pay that to the Marketplace Owner (us, Loconomics)
                ServiceFeeAmount = booking.pricingSummary.serviceFeeAmount,
                CustomerId = GetCustomerId(booking.clientUserID),
                PaymentMethodToken = booking.paymentMethodID,
                // Now, with Marketplace #408, the receiver of the money for each transaction is
                // the provider through account at Braintree, and not the Loconomics account:
                //MerchantAccountId = LcPayment.BraintreeMerchantAccountId,
                MerchantAccountId = GetProviderPaymentAccountId(booking.serviceProfessionalUserID),
                // We explicitely ask for an immediate transaction (it's the default, but let's being explicit):
                Options = new TransactionOptionsRequest
                {
                    // Marketplace #408: we normally hold it, but this is a cancellation so don't hold, pay at the moment
                    HoldInEscrow = false,
                    // Submit now for charge
                    SubmitForSettlement = true
                }
            };

            var r = gateway.Transaction.Sale(request);

            if (!r.IsSuccess())
            {
                throw new Exception(r.Message);
            }
            // Get the transactionID
            else if (r.Target != null
                && !String.IsNullOrEmpty(r.Target.Id))
            {
                cancellationTransactionID = r.Target.Id;
            }
        }

        // Remove temporary card: It's a complementary task, so we avoid exceptions (if possible) to interrupt the process
        try
        {
            // If the card is a TEMPorarly card (just to perform this transaction)
            // it must be removed now since was successful used
            if (booking.paymentMethodID.StartsWith(TempSavedCardPrefix))
                gateway.CreditCard.Delete(booking.paymentMethodID);
        }
        catch { }

        return cancellationTransactionID;
    }

    /// <summary>
    /// Prefix for the ID/Token of temporarly saved credit cards on Braintree Vault,
    /// for transactions that doesn't want to save it permanently.
    /// </summary>
    public const string TempSavedCardPrefix = "TEMPCARD_";
    #endregion

    #region Actions: Refund
    /// <summary>
    /// Full refund: cancels an authorized transaction ensuring that will
    /// be no charge to the customer or will be refunded if there was a charge already (is settled).
    /// If the transaction is invalid, was not accepted or another state that says that
    /// no charge happens, 'null' will be returned, just the same as if the refund operation
    /// was success.
    /// If there is an error, the error message will be returned.
    /// 
    /// REVIEWED #771
    /// </summary>
    /// <param name="transactionID"></param>
    /// <returns></returns>
    public static string FullRefundTransaction(string transactionID)
    {
        if (IsFakeTransaction(transactionID))
            return null;

        Result<Transaction> r = null;

        try
        {
            var gateway = NewBraintreeGateway();

            // Check if the transaction has something to refund (was not refunded yet)
            Transaction transaction = null;
            try
            {
                transaction = gateway.Transaction.Find(transactionID);
            }
            catch (Braintree.Exceptions.NotFoundException ex) { }
            if (transaction == null)
                // It doesn't exists, 'refunded' ;)
                return null;

            if (transaction.Amount > 0)
            {
                // There is something to refund:
                if (transaction.Status == TransactionStatus.SETTLED ||
                    transaction.Status == TransactionStatus.SETTLING)
                {
                    // Full refund transaction.
                    r = gateway.Transaction.Refund(transactionID);
                }
                else if (transaction.Status == TransactionStatus.AUTHORIZED ||
                    transaction.Status == TransactionStatus.AUTHORIZING ||
                    transaction.Status == TransactionStatus.SUBMITTED_FOR_SETTLEMENT)
                {
                    // Void transaction:
                    r = gateway.Transaction.Void(transactionID);
                }
                else
                {
                    // No transaction, no accepted, no charge, nothing to refund
                    return null;
                }
            }
        }
        catch (Exception ex)
        {
            return ex.Message;
        }
        return (r == null || r.IsSuccess() ? null : r.Message);
    }
    #endregion

    #region Actions: Confirming payment
    /// <summary>
    /// Submit to settlement a transaction to be full charged its authorized
    /// amount.
    /// 
    /// REVIEWED #771
    /// </summary>
    /// <param name="transactionID"></param>
    /// <returns></returns>
    public static string SettleTransaction(string transactionID)
    {
        if (IsFakeTransaction(transactionID))
            return null;

        Result<Transaction> r = null;

        try
        {
            var gateway = NewBraintreeGateway();

            r = gateway.Transaction.SubmitForSettlement(transactionID);
        }
        catch (Exception ex)
        {
            return ex.Message;
        }

        return (r == null || r.IsSuccess() ? null : r.Message);
    }
    /// <summary>
    /// On Marketplace, this sends a request to pay the amount 
    /// in the transaction to the Merchant Account (Provider)
    /// and the fees to the Marketplace Owner (us).
    /// A call for SettleTransaction there was need previous to this with enough
    /// time in advance.
    /// 
    /// REVIEWED #771
    /// </summary>
    /// <param name="transactionID"></param>
    /// <returns></returns>
    public static string ReleaseTransactionFromEscrow(string transactionID)
    {
        if (IsFakeTransaction(transactionID))
            return null;

        Result<Transaction> r = null;

        try
        {
            var gateway = NewBraintreeGateway();

            r = gateway.Transaction.ReleaseFromEscrow(transactionID);
        }
        catch (Exception ex)
        {
            return ex.Message;
        }

        return (r == null || r.IsSuccess() ? null : r.Message);
    }
    #endregion

    #region Customer information
    /// <summary>
    /// Get the payment gateway ID for a customer based on our userID
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static string GetCustomerId(int userID)
    {
        return ASP.LcHelpers.Channel + "_" + userID.ToString();
    }

    /// <summary>
    /// Returns the customer information on Braintree for the given userID,
    /// or null if not exists.
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="gateway">Optional, to reuse an opened gateway, else a new one is transparently created</param>
    /// <returns></returns>
    public static Braintree.Customer GetBraintreeCustomer(int userID, BraintreeGateway gateway = null) {
        gateway = LcPayment.NewBraintreeGateway(gateway);
        try {
            return gateway.Customer.Find(GetCustomerId(userID));
        } catch (Braintree.Exceptions.NotFoundException ex) {
        }
        return null;
    }

    /// <summary>
    /// Find or create Customer on Braintree
    /// given our database userID that is converted to the ID format
    /// for marketplace customers at Braintree.
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static Braintree.Customer GetOrCreateBraintreeCustomer(int userID)
    {
        return GetOrCreateBraintreeCustomer(GetCustomerId(userID));
    }

    /// <summary>
    /// Find or create Customer on Braintree
    /// given the ID at Braintree/gateway.
    /// </summary>
    /// <param name="gatewayUserID"></param>
    /// <returns></returns>
    public static Braintree.Customer GetOrCreateBraintreeCustomer(string gatewayUserID)
    {
        var gateway = NewBraintreeGateway();

        try
        {
            return gateway.Customer.Find(gatewayUserID);
        }
        catch (Braintree.Exceptions.NotFoundException)
        {
            // Customer doens't exist, create it:
            var gcr = new CustomerRequest{
                Id = gatewayUserID
            };

            var r = gateway.Customer.Create(gcr);
            if (r.IsSuccess())
            {
                return r.Target;
            }
            else
            {
                throw new Braintree.Exceptions.BraintreeException("Impossible to create customer #" + gatewayUserID + ":: " + r.Message);
            }
        }
    }
    #endregion

    #region Customer Payment Methods (saved cards)
    public static List<CreditCard> GetSavedCreditCards(int userID)
    {
        var gateway = NewBraintreeGateway();
        try
        {
            var gc = gateway.Customer.Find(GetCustomerId((int)userID));
            var savedCards = gc.CreditCards;
            
            // Filter credit cards to avoid the temporary ones
            var filteredCards = new List<CreditCard>();
            foreach(var card in savedCards) {
                if (card.Token != null && !card.Token.StartsWith(TempSavedCardPrefix)) {
                    filteredCards.Add(card);
                }
            }
            
            return filteredCards;
            //savedCards = filteredCards.ToArray<CreditCard>();
        }
        catch (Braintree.Exceptions.NotFoundException ex) {}

        return null;
    }
    #endregion

    #region Booking 
    public class PaymentInfo
    {
        public string PaymentMethodID { get; set; }
        public string PaymentLastFourCardNumberDigits { get; set; }
        public bool PaymentCollected { get; set; }
        public bool PaymentAuthorized { get; set; }
        public string PaymentTransactionID { get; set; }
        public string CancellationPaymentTransactionID { get; set; }
    }

    public static PaymentInfo CollectPayment(int bookingID, int clientUserID, LcPayment.InputPaymentMethod paymentData, bool savePayment, out Dictionary<string, string> validationResults)
    {
        var paymentInfo = new PaymentInfo();
        validationResults = null;

        // The steps on emulation allows a quick view of what the overall process does and data being set.
        if (LcPayment.TESTING_EMULATEBRAINTREE)
        {
            paymentInfo = new PaymentInfo()
            {
                PaymentTransactionID = null,
                CancellationPaymentTransactionID = null,
                PaymentMethodID = LcPayment.CreateFakePaymentMethodId(),
                PaymentLastFourCardNumberDigits = null,
                PaymentCollected = true,
                PaymentAuthorized = true
            };
        }
        else
        {
            BraintreeGateway gateway = LcPayment.NewBraintreeGateway();
            // Find or create Customer on Braintree
            var client = LcPayment.GetOrCreateBraintreeCustomer(clientUserID);

            //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT, Braintree preparation, client " + clientUserID);

            // Quick way for saved payment method that does not needs to be updated
            var hasID = !String.IsNullOrWhiteSpace(paymentData.paymentMethodID);
            if (hasID && !savePayment)
            {
                // Just double check payment exists to avoid mistake/malicious attempts:
                if (!paymentData.ExistsOnVault())
                {
                    //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT THROWS: Chosen payment method has expired");
                    // Since we have not input data to save, we can only throw an error
                    // invalidSavedPaymentMethod
                    throw new ConstraintException("[[[Chosen payment method has expired]]]");
                }
            }
            else
            {
                // Creates or updates a payment method with the given data

                // We create a temp ID if needed
                // (when an ID is provided, thats used -and validated and autogenerated if is not found while saving-,
                // and an empty ID for a payment to save is just left empty to be autogenerated as a persistent payment method)
                if (!hasID && !savePayment)
                {
                    paymentData.paymentMethodID = LcPayment.TempSavedCardPrefix + ASP.LcHelpers.Channel + "_" + bookingID.ToString();
                }

                // Validate
                validationResults = paymentData.Validate();
                if (validationResults.Count > 0)
                {
                    //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT THROWS: validation errors, before delete booking");

                    //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT THROWS: validation errors, before return them");
                    return null;
                }

                // Save on Braintree secure Vault
                // It updates the paymentMethodID if a new one was generated
                var saveCardError = paymentData.SaveInVault(client.Id);
                if (!String.IsNullOrEmpty(saveCardError))
                {
                    //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT THROWS: saveCardError: " + saveCardError);
                    // paymentDataError
                    throw new ConstraintException(saveCardError);
                }
            }

            paymentInfo = new PaymentInfo()
            {
                // We have a valid payment ID at this moment, save it on the booking
                PaymentMethodID = paymentData.paymentMethodID,
                // Set card number (is processed later while saving to ensure only 4 and encrypted are persisted)
                PaymentLastFourCardNumberDigits = paymentData.cardNumber,
                // Flags
                PaymentCollected = true,
                PaymentAuthorized = false,
                PaymentTransactionID = null,
                CancellationPaymentTransactionID = null
            };
            
            return paymentInfo;

            //ASP.LcHelpers.DebugLogger.Log("COLLECT PAYMENT THROWS: finished Braintree tasks");
        }

        return paymentInfo;
    }

    #endregion

    #region Marketplace

    public const string MarketplaceProviderFee = "2.9% plus $0.30";

    #region Provider information
    /// <summary>
    /// Get the AccountId (where to pay) on the payment gateway
    /// for a provider user.
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static string GetProviderPaymentAccountId(int userID)
    {
        return "Marketplace_" + GetCustomerId(userID);
    }
    #endregion

    #region Payment Account (Merchant Account). Needs refactor to simplify in one 'create' method
    /// <summary>
    /// Create the payment account for the provider at the payment gateway (Braintree) given
    /// its Loconomics UserID.
    /// On Braintree Marketplace, this is called 'Create a Sub Merchant'
    /// </summary>
    /// <param name="providerID"></param>
    /// <param name="gateway"></param>
    /// <returns>It returns the result of the Braintree transaction (check for IsSuccess to know the result),
    /// or null when there Braintree doesn't authorize the operation (AuthorizationException catched) or there is
    /// not enough information for that userID, both cases it means the details are not complete or malformed.</returns>
    public static Result<MerchantAccount> CreateProviderPaymentAccount(int providerID, BraintreeGateway gateway = null)
    {
        gateway = NewBraintreeGateway(gateway);
        var provider = LcData.UserInfo.GetUserRowWithContactData(providerID);
        var address = LcData.GetFirstUserAddressOfType(providerID, LcData.Address.AddressType.Billing);
        var bank = LcData.UserInfo.GetUserBankInfo(providerID);
        if (provider != null && address != null)
        {
            return CreateProviderPaymentAccount(provider, address, bank.ABANumber, gateway);
        }
        return null;
    }

    /// <summary>
    /// Create the payment account for the provider at the payment gateway (Braintree) given
    /// that user information.
    /// On Braintree Marketplace, this is called 'Create a Sub Merchant'
    /// </summary>
    /// <param name="user"></param>
    /// <param name="address"></param>
    /// <param name="bank"></param>
    /// <param name="gateway"></param>
    /// <returns>It returns the result of the Braintree transaction (check for IsSuccess to know the result),
    /// or null when there Braintree doesn't authorize the operation (AuthorizationException catched),
    /// it means the details are not complete or malformed.</returns>
    public static Result<MerchantAccount> CreateProviderPaymentAccount(dynamic user, LcData.Address address, string ABANumber, BraintreeGateway gateway = null) {
        gateway = NewBraintreeGateway(gateway);
        
        var braintreeCustomer = GetBraintreeCustomer((int)user.UserID, gateway);
        string tin = null;
        string accountNumber = null;
        if (braintreeCustomer != null) {
            tin = braintreeCustomer.CustomFields.ContainsKey("loco_tin")
                ? braintreeCustomer.CustomFields["loco_tin"]
                : null;
            accountNumber = braintreeCustomer.CustomFields.ContainsKey("loco_bank_account")
                ? braintreeCustomer.CustomFields["loco_bank_account"]
                : null;
        }

        dynamic bank = new {
            RoutingNumber = ABANumber,
            AccountNumber = accountNumber
        };

        return CreateProviderPaymentAccount(user, address, bank, DateTime.Today.AddYears(-30), tin);
    }

    public static MerchantAccount GetProviderPaymentAccount(int userId, BraintreeGateway gateway = null)
    {
        gateway = NewBraintreeGateway(gateway);

        var accountID = LcPayment.GetProviderPaymentAccountId(userId);
        MerchantAccount btAccount = null;

        // Find any existant one:
        try
        {
            btAccount = gateway.MerchantAccount.Find(accountID);
        }
        catch (Braintree.Exceptions.NotFoundException ex) { }

        return btAccount;
    }

    /// <summary>
    /// Create or update the payment account for the provider at the payment gateway (Braintree) given
    /// that user information.
    /// On Braintree Marketplace, this is called 'Create a Sub Merchant'
    /// </summary>
    /// <param name="user"></param>
    /// <param name="address"></param>
    /// <param name="bank"></param>
    /// <param name="gateway"></param>
    /// <returns>It returns the result of the Braintree transaction (check for IsSuccess to know the result),
    /// or null when there Braintree doesn't authorize the operation (AuthorizationException catched),
    /// it means the details are not complete or malformed.</returns>
    public static dynamic CreateProviderPaymentAccount(dynamic user, LcData.Address address, dynamic bank, DateTime BirthDate, string Ssn, BraintreeGateway gateway = null) {
        gateway = NewBraintreeGateway(gateway);

        // We need to detect what FundingDestination notify depending on the provided
        // information
        // Analizing source bank information: asterisks means 'not to set -- preseve previous value', other value is send being
        // null or empty to clear/remove previous value
        // Next variables will have null for 'not to set' or any other to be udpated.
        string routingNumber = null;
        string accountNumber = null;
        FundingDestination fundingDest = FundingDestination.EMAIL;
        if (bank != null)
        {
            // Null and asterisks values are not set
            if (bank.RoutingNumber != null && !bank.RoutingNumber.Contains("*"))
                routingNumber = bank.RoutingNumber;

            if (bank.AccountNumber != null && !bank.AccountNumber.Contains("*"))
                accountNumber = bank.AccountNumber;
            
            // We check against the bank object because has the original values.
            // Here, we allow an asterisks value as valid, because is a previous one
            // that will be preserved, or any new value to be set just different
            // from empty or null
            if (!String.IsNullOrEmpty(bank.AccountNumber) && !String.IsNullOrEmpty(bank.RoutingNumber))
            {
                fundingDest = FundingDestination.BANK;
            }
            else if (!String.IsNullOrWhiteSpace(user.MobilePhone))
            {
                fundingDest = FundingDestination.MOBILE_PHONE;
            }
        }

        var updateBankInfo = bank != null;
       
        var btAccount = GetProviderPaymentAccount((int)user.UserID);

        MerchantAccountRequest request = new MerchantAccountRequest
        {
            Individual = new IndividualRequest
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Phone = user.MobilePhone,
                Address = new AddressRequest
                {
                    StreetAddress = address.AddressLine1,
                    // NOTE: We set the ExtendedAddress, but was communicated by Braintree on 2014-03-12
                    // that field is not being stored (support messages copies at #454).
                    // On the interface, we rely on our db for the copied version of that address part as fallback.
                    ExtendedAddress = address.AddressLine2,
                    PostalCode = address.PostalCode,
                    Locality = address.City,
                    Region = address.StateProvinceCode,
                    //CountryCodeAlpha2 = address.CountryCodeAlpha2
                },
                DateOfBirth = BirthDate.ToString("yyyy-MM-dd")
            },
            TosAccepted = true,
            MasterMerchantAccountId = BraintreeMerchantAccountId,
            Id = LcPayment.GetProviderPaymentAccountId((int)user.UserID)
        };

        if (btAccount == null || String.IsNullOrWhiteSpace(Ssn) || !Ssn.Contains("*"))
        {
            // Braintree require pass an empty string to remove the value of SSN in case of
            // user remove it from the form field:
            request.Individual.Ssn = String.IsNullOrWhiteSpace(Ssn) ? "" : Ssn;
        }

        // Set payment/funding information only on creation or explicitely
        // asked for update of its data
        if (btAccount == null || updateBankInfo)
        {
            request.Funding = new FundingRequest{
                Destination = fundingDest,
                Email = user.Email,
                MobilePhone = user.MobilePhone
            };

            // On null, we don't set the values, empty to remove or value to set

            if (routingNumber != null)
                request.Funding.RoutingNumber = routingNumber;

            if (accountNumber != null)
                request.Funding.AccountNumber = accountNumber;
        }

        try{
            Result<MerchantAccount> ret = null;
            if (btAccount == null)
                ret = gateway.MerchantAccount.Create(request);
            else
                ret = gateway.MerchantAccount.Update(request.Id, request);

            // All Ok, register on database
            if (ret.IsSuccess())
                LcData.SetProviderPaymentAccount(
                    user.UserID,
                    request.Id,
                    btAccount == null ? "pending" : null,
                    null,
                    null,
                    null
                );

            return ret;

        } catch (Braintree.Exceptions.AuthorizationException ex) {
            throw ex;
            //return null;
        }
    }

    /// <summary>
    /// Saves on database the updated information for a payment account with the notified information that
    /// means an change on the payment gateway for that object.
    /// Braintree sends notifications through Webhooks to a configured URL, our page at that address
    /// manage it and call this when matched the Kind of notification related to the creation request
    /// for a Sub-merchant or Merchant account (aka provider payment account).
    /// </summary>
    /// <param name="notification"></param>
    public static void RegisterProviderPaymentAccountCreationNotification(WebhookNotification notification, string signature, string payload)
    {
        // If is not a SubMerchant creation, skip (maybe a new main merchant account was created)
        if (!notification.MerchantAccount.IsSubMerchant)
            return;

        var providerID = LcUtils.ExtractInt(notification.MerchantAccount.Id, 0);
        // Is not valid user
        if (providerID == 0)
        {
            using (var logger = new LcLogger("PaymentGatewayWebhook"))
            {
                logger.Log("SubMerchantAccount:: Impossible to get the provider UserID from next MerchantAccountID: {0}", notification.MerchantAccount.Id);
                logger.Log("SubMerchantAccount:: Follows signature and payload");
                logger.LogData(signature);
                logger.LogData(payload);
                logger.Save();
            }
            return;
        }

        LcData.SetProviderPaymentAccount(
            providerID,
            notification.MerchantAccount.Id,
            notification.MerchantAccount.Status.ToString(),
            notification.Message,
            signature,
            payload
        );
    }

    public static PaymentAccount GetPaymentAccount(int userID)
    {

        PaymentAccount acc = null;
        var btAccount = LcPayment.GetProviderPaymentAccount(userID);
        if (btAccount != null &&
            btAccount.IndividualDetails != null)
        {
            acc = new PaymentAccount
            {
                userID = userID,
                firstName = btAccount.IndividualDetails.FirstName,
                lastName = btAccount.IndividualDetails.LastName,
                phone = btAccount.IndividualDetails.Phone,
                email = btAccount.IndividualDetails.Email,
                streetAddress = btAccount.IndividualDetails.Address.StreetAddress,
                //extendedAddress = btAccount.IndividualDetails.Address.ExtendedAddress,
                city = btAccount.IndividualDetails.Address.Locality,
                postalCode = btAccount.IndividualDetails.Address.PostalCode,
                stateProvinceCode = btAccount.IndividualDetails.Address.Region,
                countryCode = btAccount.IndividualDetails.Address.CountryCodeAlpha2,
                birthDate = btAccount.IndividualDetails.DateOfBirth == null ? null :
                    btAccount.IndividualDetails.DateOfBirth.IsDateTime() ?
                    (DateTime?)btAccount.IndividualDetails.DateOfBirth.AsDateTime() :
                    null,
                ssn = String.IsNullOrEmpty(btAccount.IndividualDetails.SsnLastFour) ? "" : btAccount.IndividualDetails.SsnLastFour.PadLeft(10, '*'),
                status = (btAccount.Status ?? Braintree.MerchantAccountStatus.PENDING).ToString().ToLower()
            };
            // IMPORTANT: We need to strictly check for the null value of IndividualDetails and FundingDetails
            // since errors can arise, see #554
            if (btAccount.FundingDetails != null)
            {
                acc.routingNumber = btAccount.FundingDetails.RoutingNumber;
                acc.accountNumber = String.IsNullOrEmpty(btAccount.FundingDetails.AccountNumberLast4) ? "" : btAccount.FundingDetails.AccountNumberLast4.PadLeft(10, '*');
                // Is Venmo account if there is no bank informatino
                acc.isVenmo = String.IsNullOrEmpty(acc.accountNumber) && String.IsNullOrEmpty(acc.routingNumber);
            }
        }
        else
        {
            // Automatically fetch personal data from our DB (this will work as a preset)
            var data = LcRest.UserProfile.Get(userID);
            var add = LcRest.Address.GetHomeAddress(userID);
            acc = new PaymentAccount
            {
                userID = userID,
                firstName = data.firstName,
                lastName = data.lastName,
                phone = data.phone,
                email = data.email,
                streetAddress = add.addressLine1,
                postalCode = add.postalCode,
                city = add.city,
                stateProvinceCode = add.stateProvinceCode
            };
        }
        // Get data from our database as LAST step: both when there is data from Braintree and when not (this will let status to work
        // on localdev environments too, for testing)
        var dbAccount = LcData.GetProviderPaymentAccount(userID);
        if (dbAccount != null)
        {
            // Status from Braintree is not working, or has a big delay setting up the first time so user don't see the status,
            // using our saved copy:
            acc.status = (string)dbAccount.Status;
            //if (btAccount.Status == Braintree.MerchantAccountStatus.SUSPENDED)
            if (dbAccount.status == "suspended")
            {
                var gw = LcPayment.NewBraintreeGateway();
                var notification = gw.WebhookNotification.Parse((string)dbAccount.bt_signature, (string)dbAccount.bt_payload);
                var errors = new List<string>();
                errors.Add(notification.Message);
                notification.Errors.All().Select(x => x.Code + ": " + x.Message);
                acc.errors = errors;
            }
        }
        return acc;
    }

    public static void SetPaymentAccount(PaymentAccount account)
    {
        // Gathering state and postal IDs and verifying they match
        var add = new LcRest.Address
        {
            postalCode = account.postalCode,
            countryCode = account.countryCode
        };
        if (!LcRest.Address.AutosetByCountryPostalCode(add))
        {
            throw new ValidationException("[[[Postal Code is not valid.]]]", "postalCode");
        }
        else
        {
            account.city = add.city;
            account.stateProvinceCode = add.stateProvinceCode;
        }

        var emulateBraintree = ASP.LcHelpers.Channel == "localdev";
        if (emulateBraintree)
        {
            LcData.SetProviderPaymentAccount(
                account.userID,
                "FAIK REQUEST ID: " + Guid.NewGuid(),
                "pending",
                null,
                null,
                null
            );
        }
        else
        {
            var email = LcRest.UserProfile.GetEmail(account.userID);
            var result = LcPayment.CreateProviderPaymentAccount(
                new LcData.UserInfo
                {
                    UserID = account.userID,
                    FirstName = account.firstName,
                    LastName = account.lastName,
                    Email = email,
                    MobilePhone = account.phone
                }, new LcData.Address
                {
                    AddressLine1 = account.streetAddress,
                    PostalCode = account.postalCode,
                    City = account.city,
                    StateProvinceCode = account.stateProvinceCode,
                    CountryID = add.countryID
                }, new LcPayment.BankInfo
                {
                    RoutingNumber = account.routingNumber,
                    AccountNumber = account.accountNumber
                },
                account.birthDate.Value,
                account.ssn
            );

            if (result == null)
            {
                throw new ValidationException("[[[It looks like you already have an account set up with Braintree. Please contact us, and we can help.]]]");
            }
            else if (!result.IsSuccess())
            {
                throw new ValidationException(result.Message);
                //foreach (var err in result.Errors.All()) { }
            }
        }
    }

    #region BankInfo Class
    public class BankInfo
    {
        public BankInfo() { }
        public string RoutingNumber;
        public string AccountNumber;
    }
    #endregion

    #endregion

    #endregion

    #region Fake, testing transactions/methods/subcriptions IDs that avoid Braintree
    public const string FakeTransactionPrefix = "TEST:";
    public static string CreateFakeTransactionId()
    {
        return FakeTransactionPrefix + Guid.NewGuid().ToString();
    }
    public static string CreateFakePaymentMethodId()
    {
        return FakeTransactionPrefix + Guid.NewGuid().ToString();
    }
    public static bool IsFakeTransaction(string transactionId)
    {
        return String.IsNullOrEmpty(transactionId) || transactionId.StartsWith(FakeTransactionPrefix);
    }
    public static bool IsFakePaymentMethod(string paymentMethodID)
    {
        return String.IsNullOrEmpty(paymentMethodID) || paymentMethodID.StartsWith(FakeTransactionPrefix);
    }
    public static string CreateFakeSubscriptionId()
    {
        return FakeTransactionPrefix + Guid.NewGuid().ToString();
    }
    public static bool IsFakeSubscription(string subscriptionID)
    {
        return String.IsNullOrEmpty(subscriptionID) || subscriptionID.StartsWith(FakeTransactionPrefix);
    }
    #endregion
}