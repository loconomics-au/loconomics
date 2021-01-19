using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.WebPages;

namespace LcRest
{
    /// <summary>
    /// Manages the Braintree Merchant Account that enable Payments for Service Professionals.
    /// </summary>
    public class PaymentAccount
    {
        #region Fields
        public int userID;
        public string firstName;
        public string lastName;
        public string phone;
        public string email;
        public string streetAddress;
        // Braintree is not storing the ExtendedAddress right now (confirmed by their support
        // on 2014-03-12, logged at issues #454), so keeps commented and unused.
        //public string extendedAddress;
        public string city;
        public string postalCode;
        public string routingNumber;
        public string accountNumber;
        public string stripeNumber;
        public string ssn;
        public string stateProvinceCode;
        public string countryCode;
        public DateTime? birthDate;
        public bool? isVenmo;
        public bool? isStripe;
        /// <summary>
        /// Status as notified by payment provider
        /// </summary>
        public string status;
        public IEnumerable<string> errors;
        #endregion

        public PaymentAccount()
        {

        }

        #region Fetch
        public static PaymentAccount Get(int userID)
        {
            PaymentAccount paymentAccount = null;
            var user = UserProfile.Get(userID);
            dynamic merchantAccount = LcData.GetProviderPaymentAccount(userID);
            if (merchantAccount == null)
            {
                LcData.SetProviderPaymentAccount(
                    userID,
                    "New Request ID: " + Guid.NewGuid(),
                    "pending",
                    null,
                    null,
                    null
                );

                // get new payment account
                merchantAccount = LcData.GetProviderPaymentAccount(userID);
            }

            if (merchantAccount.paymentProviderName == "braintree")
            {
                // return a braintree payment account
                paymentAccount = LcPayment.GetPaymentAccount(userID);
            }
            else if (merchantAccount.paymentProviderName == "stripe")
            {
                // return a stripe payment account
                LCStripeProvider stripeProvider = new LCStripeProvider();
                paymentAccount = stripeProvider.GetPaymentAccount(userID);
            }
            else
            {
                // return a blank PaymentAccount
                paymentAccount = new PaymentAccount()
                {
                    userID = userID,
                    firstName = String.Empty,
                    lastName = String.Empty,
                    phone = String.Empty,
                    email = user.email
                };
            }

            return paymentAccount;
        }
        #endregion

        #region Update
        public static void Set(PaymentAccount data, string paymentProvider = "braintree")
        {
            if (paymentProvider == "braintree")
            {
                LcPayment.SetPaymentAccount(data);
            }
            else if (paymentProvider == "stripe")
            {
                LCStripeProvider stripeProvider = new LCStripeProvider();
                stripeProvider.SetPaymentAccount(data);
            }

        }
        #endregion
    }
}