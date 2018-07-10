﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Braintree;
using System.Web.WebPages;

public static partial class LcPayment
{
    public class InputPaymentMethod
    {
        /// <summary>
        /// AKA creditCardToken, the ID at Braintree. Provide this value only if want to use a pre-saved
        /// payment method, null to provide new data in the other fields.
        /// When used this and savePayment=false, all the other parameters are discarded.
        /// </summary>
        public string paymentMethodID;
        /// <summary>
        /// Optional: proprietary name as is on the credit card
        /// </summary>
        public string nameOnCard;
        /// <summary>
        /// Credit card number
        /// </summary>
        public string cardNumber;
        /// <summary>
        /// Expiration month as two digits, in a string, leading zero for less than 10
        /// </summary>
        public string expirationMonth;
        /// <summary>
        /// Expiration year as four digits, in a string
        /// </summary>
        public string expirationYear;
        /// <summary>
        /// Optional: AKA CVV
        /// </summary>
        public string securityCode;

        /// <summary>
        /// Optional billing address attached to the payment method
        /// </summary>
        public LcData.Address billingAddress;

        public InputPaymentMethod() { }

        /// <summary>
        /// Validate the current set of data, previous provide it for saving,
        /// returning the list of error messages by field name, empty if valid (Count == 0).
        /// </summary>
        /// <returns></returns>
        public Dictionary<string, string> Validate()
        {
            var errors = new Dictionary<string, string>();
            // Validate fields for credit card creation
            // Removed 'name as on card' as asked by Josh at 2016-02-15 #735
            //if (nameOnCard.IsEmpty())
            //{
            //    errors.Add("nameOnCard", "'Name as on card' is required");
            //}
            if (cardNumber.IsEmpty())
            {
                errors.Add("cardNumber", "[[[Card number is required]]]");
            }
            if (securityCode.IsEmpty())
            {
                errors.Add("securityCode", "[[[CVV code is required]]]");
            }
            if (expirationMonth.IsEmpty())
            {
                errors.Add("expirationMonth", "[[[Card expiration month is required]]]");
            }
            if (expirationYear.IsEmpty())
            {
                errors.Add("expirationYear", "[[[Card expiration year is required]]]");
            }

            return errors;
        }

        public CreditCardRequest ToRequest()
        {
            var request = new CreditCardRequest
            {
                CardholderName = nameOnCard,
                Number = cardNumber,
                ExpirationMonth = expirationMonth,
                ExpirationYear = expirationYear,
                CVV = securityCode
            };

            if (billingAddress != null)
            {
                request.BillingAddress = new CreditCardAddressRequest
                {
                    StreetAddress = billingAddress.AddressLine1,
                    ExtendedAddress = billingAddress.AddressLine2,
                    Locality = billingAddress.City,
                    Region = billingAddress.StateProvinceCode,
                    PostalCode = billingAddress.PostalCode,
                    CountryCodeAlpha2 = billingAddress.CountryCodeAlpha2
                };
            }

            return request;
        }

        public string SaveInVault(string clientIdOnBraintree)
        {
            var creditCardRequest = ToRequest();
            creditCardRequest.CustomerId = clientIdOnBraintree;

            var gateway = NewBraintreeGateway();

            Result<CreditCard> result = null;

            if (ExistsOnVault(gateway))
            {
                result = gateway.CreditCard.Update(paymentMethodID, creditCardRequest);
            }
            else
            {
                result = gateway.CreditCard.Create(creditCardRequest);
            }

            if (result.IsSuccess())
            {
                // New Token
                paymentMethodID = result.Target.Token;
                ASP.LcHelpers.DebugLogger.Log("Created card {0}", paymentMethodID);
                return null;
            }
            else
            {
                return result.Message;
            }
        }

        /// <summary>
        /// Check if the current paymentMethodID exists on the Braintree Vault.
        /// If exists but expired, returns false too.
        /// It quickly returns if there is not ID, as false.
        /// </summary>
        /// <param name="gateway"></param>
        /// <returns></returns>
        public bool ExistsOnVault(BraintreeGateway gateway = null)
        {
            if (String.IsNullOrWhiteSpace(paymentMethodID)) return false;
            try
            {
                gateway = NewBraintreeGateway(gateway);
                var saved = gateway.CreditCard.Find(paymentMethodID);
                return saved.IsExpired.HasValue && saved.IsExpired.Value ? false : true;
            }
            catch (Braintree.Exceptions.NotFoundException)
            {
                return false;
            }
        }

        public bool IsTemporaryID()
        {
            return (paymentMethodID ?? "").StartsWith(TempSavedCardPrefix);
        }

        /// <summary>
        /// Returns true if there is an ID set, and this is
        /// not temporary, so looks like an ID generated by Braintree
        /// that can be used to perform payments. This is a guess,
        /// useful for quick validatios or switch logic to apply based on
        /// data, to really check if the ID exists and has not expired at Braintree,
        /// use ExistsOnVault.
        /// </summary>
        /// <returns></returns>
        public bool IsSavedID()
        {
            return !String.IsNullOrWhiteSpace(paymentMethodID) && !IsTemporaryID();
        }
    }
}