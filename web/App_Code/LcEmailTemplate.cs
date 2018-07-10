using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.WebPages;
using WebMatrix.WebData;

/// <summary>
/// Utilities for use when building email templates.
/// </summary>
public static class LcEmailTemplate
{
    private static HttpRequest Request
    {
        get
        {
            return System.Web.HttpContext.Current.Request;
        }
    }

    public class ServicePricing
    {
        public LcRest.ServiceProfessionalService service;
        public LcRest.PricingSummaryDetail pricing;

        public ServicePricing() { }

        public static IEnumerable<ServicePricing> GetForPricingSummary(LcRest.PricingSummary pricingSummary)
        {
            if (pricingSummary.details != null && pricingSummary.details.Count() > 0)
            {
                var services = LcRest.ServiceProfessionalService.GetFromPricingSummary(pricingSummary.pricingSummaryID, pricingSummary.pricingSummaryRevision);

                if (services != null)
                {
                    // Mix booking pricing details and service details in a list, by the common serviceProfessionaServiceID
                    // so is easiest from templates to access all that info while we keep in one database call
                    // the query for all the pricing details (rather than one call per each).
                    foreach (var service in services)
                    {
                        var pricingDetail = pricingSummary.details.First(pd => pd.serviceProfessionalServiceID == service.serviceProfessionalServiceID);
                        yield return new ServicePricing
                        {
                            service = service,
                            pricing = pricingDetail
                        };
                    }
                }
            }
        }
    }

    public class BasicEmailInfo
    {
        /// <summary>
        /// URL: Opens "talk to us" that a client sees.
        /// </summary>
        public string viewClientHelpCenter
        {
            get
            {
                return LcUrl.AppUrl + "help";
            }
        }
        /// <summary>
        /// Opens the Background Check Policy page.
        /// </summary>
        public string viewBackgroundCheckPolicy
        {
            get
            {
                return LcUrl.AppUrl + "terms/background-check-policy";
            }
        }
        /// <summary>
        /// URL: Opens the Terms page.
        /// </summary>
        public string viewTermsOfService
        {
            get
            {
                return LcUrl.AppUrl + "terms/terms-of-service";
            }
        }
        /// <summary>
        /// URL: Opens the Privacy Policy page.
        /// </summary>
        public string viewPrivacyPolicy
        {
            get
            {
                return LcUrl.AppUrl + "terms/privacy-policy";
            }
        }
        /// <summary>
        /// URL: Opens "talk to us" that a Service Professional sees.
        /// </summary>
        public string viewServiceProfessionalHelpCenter
        {
            get
            {
                return LcUrl.AppUrl + "help/categories/200431835-resources-for-service-professionals";
            }
        }
        public string viewCommunicationPreferences
        {
            get
            {
                return LcUrl.AppUrl + "privacySettings";
            }
        }
    }

    public class BookingEmailInfo : BasicEmailInfo
    {
        public LcRest.Booking booking;
        //public List<ServicePricing> servicePricing;
        /// <summary>
        /// Making publicly available an internal property of booking.
        /// </summary>
        public LcRest.PublicUserJobTitle userJobTitle;
        public LcRest.CancellationPolicy cancellationPolicy;

        private LcRest.PublicUserProfile _serviceProfessional;
        public LcRest.PublicUserProfile serviceProfessional
        {
            get
            {
                if (_serviceProfessional == null)
                    _serviceProfessional = LcRest.PublicUserProfile.GetForInternalUse(booking.serviceProfessionalUserID);
                return _serviceProfessional;
            }
        }

        private LcRest.PublicUserProfile _client;
        public LcRest.PublicUserProfile client
        {
            get
            {
                if (_client == null)
                    _client = LcRest.PublicUserProfile.GetForInternalUse(booking.clientUserID);
                return _client;
            }
        }

        private LcMessaging.SendBooking.JobTitleMessagingFlags _flags;
        public LcMessaging.SendBooking.JobTitleMessagingFlags flags
        {
            get
            {
                if (_flags == null)
                    _flags = LcMessaging.SendBooking.JobTitleMessagingFlags.Get(booking.jobTitleID, booking.languageID, booking.countryID);
                return _flags;
            }
        }

        private LcRest.PublicJobTitle _jobTitle;
        public LcRest.PublicJobTitle jobTitle
        {
            get
            {
                if (_jobTitle == null)
                    _jobTitle = LcRest.PublicJobTitle.Get(booking.jobTitleID, booking.languageID, booking.countryID);
                return _jobTitle;
            }
        }

        /// <summary>
        /// Gets the limit date-time to allow a cancellation for current booking,
        /// and different rules to get money refunded depending
        /// on the policy and that date.
        ///  DO NOT use this value to directly format a string at templates, use the
        ///  displayCancellationLimitDate method that uses the common format with time zone.
        /// </summary>
        public DateTimeOffset cancellationLimitDate
        {
            get
            {
                // Default base date is an example with plus 7 days from now.
                var baseDate = DateTimeOffset.Now.AddDays(7);

                if (booking.serviceDate != null)
                {
                    baseDate = booking.serviceDate.startTime;
                }

                return baseDate.AddHours(0 - cancellationPolicy.hoursRequired);
            }
        }

        public string displayCancellationLimitDate()
        {
            return LcUtils.Time.ZonedTimeOnDateString(cancellationLimitDate, booking.serviceDate.timeZone);
        }

        /// <summary>
        /// Let's know if current booking is in request status.
        /// This is a very used check.
        /// </summary>
        public bool isBookingRequest
        {
            get
            {
                return booking.bookingStatusID == (int)LcEnum.BookingStatus.request;
            }
        }

        #region URLs
        public static string GetBookingUrl(int bookingID)
        {
            return LcUrl.AppUrl + "viewBooking/" + bookingID.ToString();
        }
        /// <summary>
        /// URL: Opens a view in the website where the user can see the email content
        /// </summary>
        public string viewEmailUrl
        {
            get
            {
                return LcUrl.LangUrl + "inbox/booking/" + booking.bookingID;
            }
        }
        /// <summary>
        /// URL: Opens the booking process that a client sees to make a new booking with the Service Professional.
        /// </summary>
        public string newServiceProfessionalBooking
        {
            get
            {
                return LcUrl.AppUrl + "booking/" + booking.serviceProfessionalUserID.ToString() + "/" + booking.jobTitleID.ToString();
            }
        }
        /// <summary>
        /// URL: Opens the booking card that the client sees.
        /// </summary>
        public string viewClientBookingCard
        {
            get
            {
                return GetBookingUrl(booking.bookingID);
            }
        }
        /// <summary>
        /// URL: Opens the review page that the client sees to review the Service Professional.
        /// </summary>
        public string viewServiceProfessionalReviewForm
        {
            get
            {
                return LcUrl.AppUrl + "reviews/" + booking.bookingID.ToString();
            }
        }
        /// <summary>
        /// URL: Client view of the Service Professional profile.
        /// </summary>
        public string viewServiceProfessionalProfile
        {
            get
            {
                return serviceProfessional.serviceProfessionalProfileUrl;
            }
        }
        /// <summary>
        /// URL: Opens the booking process that a Service Professional sees to make a new booking with the client.
        /// </summary>
        public string newClientBooking
        {
            get
            {
                return LcUrl.AppUrl + "appointment/?clientID=" + booking.clientUserID.ToString();
            }
        }
        /// <summary>
        /// URL: Opens the booking card that the Service Professional sees.
        /// </summary>
        public string viewServiceProfessionalBookingCard
        {
            get
            {
                return GetBookingUrl(booking.bookingID);
            }
        }
        /// <summary>
        /// URL: Opens the review page that the Service Professional sees to review the Client Professional.
        /// </summary>
        public string viewClientReviewForm
        {
            get
            {
                return LcUrl.AppUrl + "reviews/" + booking.bookingID.ToString();
            }
        }
        /// <summary>
        /// URL: Service Professional view of the Client profile.
        /// </summary>
        public string viewClientProfile
        {
            get
            {
                return LcUrl.AppUrl + "profile/" + booking.clientUserID.ToString();
            }
        }
        #endregion
    }

    public static BookingEmailInfo GetBookingInfo(IDictionary<object, dynamic> PageData)
    {
        if (PageData[0] is BookingEmailInfo) return (BookingEmailInfo)PageData[0];
        if (PageData["BookingEmailInfo"] is BookingEmailInfo) return (BookingEmailInfo)PageData["BookingEmailInfo"];
        throw new Exception("Booking info not found at Email component");
    }

    public static BookingEmailInfo GetBookingInfo()
    {
        return GetBookingInfo(Request["bookingID"].AsInt());
    }

    public static BookingEmailInfo GetBookingInfo(int bookingID)
    {
        var bID = bookingID;
        // We need the booking including some internal sensitive data (like 'payment last four digits')
        // since here we have not enough context to know what userID is the target, and must not be a problem
        // since this data is never provided as is, but only used by the templates that must be carefull with what
        // data to show to every case.
        var b = LcRest.Booking.Get(bID, true, true);
        if (b == null) throw new Exception("BookingID not found #" + bID + ", at Email template");

        /* Generics not used in new email template organization, but keep this commented
         * for any future chance:
        var url = Request.Url.OriginalString.ToUpper();
        var sentTo = LcData.UserInfo.UserType.None;
        if (url.IndexOf("/TOCLIENT/") > -1) {
            sentTo = LcData.UserInfo.UserType.Client;
        }
        else if (url.IndexOf("/TOSERVICEPROFESSIONAL/") > -1) {
            sentTo = LcData.UserInfo.UserType.ServiceProfessional;
        }
        int toUserID = 0;
        if (sentTo == LcData.UserInfo.UserType.ServiceProfessional) {
            toUserID = b.serviceProfessionalUserID;
        }
        else if (sentTo == LcData.UserInfo.UserType.Client) {
            toUserID = b.clientUserID;
        }
        */

        // Cancellation policy
        var policy = LcRest.CancellationPolicy.Get(b.cancellationPolicyID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

        return new BookingEmailInfo
        {
            booking = b,
            //servicePricing = GetForPricingSummary(b.pricingSummary),
            userJobTitle = b.userJobTitle,
            cancellationPolicy = policy
            //,SentTo = sentTo
            //,SentToUserID = toUserID
        };
    }

    public class AccountEmailInfo : BasicEmailInfo
    {
        public int userID;
        string confirmationToken;

        private LcRest.PublicUserProfile _user;
        public LcRest.PublicUserProfile user
        {
            get
            {
                if (_user == null)
                    _user = LcRest.PublicUserProfile.GetForInternalUse(userID);
                return _user;
            }
        }
        /// <summary>
        /// Alias
        /// </summary>
        public LcRest.PublicUserProfile client
        {
            get
            {
                return user;
            }
        }
        /// <summary>
        /// Alias
        /// </summary>
        public LcRest.PublicUserProfile serviceProfessional
        {
            get
            {
                return user;
            }
        }

        public LcRest.PublicUserJobTitle userJobTitle;

        public bool accountNeedsConfirmation
        {
            get
            {
                // IMPORTANT: Copied initialization code from viewEmailVerificationURL
                // check if null to know that was not loaded still. The value can be empty when is loaded
                // but no confirmationToken exists because confirmation already happened
                if (confirmationToken == null)
                {
                    confirmationToken = LcAuth.GetConfirmationToken(userID) ?? "";
                }
                return !String.IsNullOrEmpty(confirmationToken);
            }
        }

        #region URLs
        /// <summary>
        /// Link to to a page that prompts user with an email box and 'reset' button,
        /// sending a message to the given e-mail with a button/link to create a new password
        /// for the account linked to the email, for cases where user lost its password.
        /// </summary>
        public string viewPasswordResetURL
        {
            get
            {
                return LcUrl.AppUrl + "login/reset-password";
            }
        }
        /// <summary>
        /// Internal field to set the password reset token, only preset when processing a 'reset password request' email.
        /// </summary>
        public string passwordResetToken;
        /// <summary>
        /// Link back to the 'reset password' providing the user specific 'reset token',
        /// the page will prompts user with a password field, confirmation and 'reset' button.
        /// </summary>
        public string viewPasswordResetWithTokenURL
        {
            get
            {
                return LcUrl.AppUrl + "login/reset-password/confirm?token=" + Uri.EscapeDataString(passwordResetToken);
            }
        }
        /// <summary>
        /// One-click verifies their e-mail
        /// </summary>
        public string viewEmailVerificationURL
        {
            get
            {
                // IMPORTANT: Initialization code copied to accountNeedsConfirmation
                // check if null to know that was not loaded still. The value can be empty when is loaded
                // but no confirmationToken exists because confirmation already happened
                if (confirmationToken == null)
                {
                    confirmationToken = LcAuth.GetConfirmationToken(userID) ?? "";
                }
                return LcUrl.AppUrl + "auth/confirm/?confirmationCode=" + Uri.EscapeDataString(confirmationToken);
            }
        }
        public string viewDownloadAppURL
        {
            get
            {
                return LcUrl.AppUrl + "downloadApp";
            }
        }
        /// <summary>
        /// Brings the professional to the on boarding for scheduling
        /// </summary>
        public string viewSchedulingOnboard
        {
            get
            {
                return LcUrl.AppUrl + "dashboard";
            }
        }
        /// <summary>
        /// Brings the professional to the on boarding for marketplace profile...I don't think we have actual on boarding so just brings them to the marketplace profile in the app
        /// </summary>
        public string viewMarketplaceProfileOnboard
        {
            get
            {
                return LcUrl.AppUrl + "marketplaceProfile";
            }
        }
        /// <summary>
        /// Brings the professional to the on boarding for selecting a payment plan and entering payment info. If all other steps to becoming an owner are complete, it brings them to BecomeOwnerOnboard
        /// </summary>
        public string viewPaymentPlanOnboard
        {
            get
            {
                return LcUrl.AppUrl + "paymentPlan";
            }
        }
        /// <summary>
        /// Brings the professional to the on boarding for becoming an owner (owner acknowledgment
        /// </summary>
        public string viewBecomeOwnerOnboard
        {
            get
            {
                return LcUrl.AppUrl + "becomeOwner";
            }
        }
        /// <summary>
        /// Brings the professional to enter earnings.
        /// </summary>
        public string viewEnterEarningsURL
        {
            get
            {
                return LcUrl.AppUrl + "earnings-add";
            }
        }
        #endregion
    }

    public static AccountEmailInfo GetAccountInfo(int userID, int? jobTitleID = null)
    {
        var a = new AccountEmailInfo
        {
            userID = userID
        };

        if (jobTitleID.HasValue)
        {
            a.userJobTitle = LcRest.PublicUserJobTitle.FromUserJobTitle(LcRest.UserJobTitle.GetItem(userID, jobTitleID.Value));
        }

        return a;
    }

    public static AccountEmailInfo GetAccountInfo()
    {
        var acc = GetAccountInfo(Request["userID"].AsInt(), Request["jobTitleID"].IsInt() ? Request["jobTitleID"].AsInt() : (int?)null);
        acc.passwordResetToken = Request["passwordResetToken"];
        return acc;
    }

    public static AccountEmailInfo GetAccountInfo(IDictionary<object, dynamic> PageData)
    {
        if (PageData[0] is AccountEmailInfo) return (AccountEmailInfo)PageData[0];
        if (PageData["AccountEmailInfo"] is AccountEmailInfo) return (AccountEmailInfo)PageData["AccountEmailInfo"];
        throw new Exception("Account info not found at Email component");
    }

    #region General utils
    public static string GetLocationForGoogleMaps(LcRest.Address address)
    {
        return ASP.LcHelpers.JoinNotEmptyStrings(", ", address.addressLine1, address.city, address.stateProvinceCode, address.countryCode);
    }

    public static string GetLocationGoogleMapsUrl(LcRest.Address address)
    {
        return "http://maps.google.com/?q=" + Uri.EscapeDataString(GetLocationForGoogleMaps(address));
    }
    #endregion

    #region Posting
    public class PostingEmailInfo : BasicEmailInfo
    {
        public int serviceProfessionalID;

        public LcRest.UserPosting posting;

        private LcRest.PublicUserProfile _serviceProfessional;
        public LcRest.PublicUserProfile serviceProfessional
        {
            get
            {
                if (_serviceProfessional == null)
                    _serviceProfessional = LcRest.PublicUserProfile.GetForInternalUse(serviceProfessionalID);
                return _serviceProfessional;
            }
        }

        private LcRest.PublicUserProfile _client;
        public LcRest.PublicUserProfile client
        {
            get
            {
                if (_client == null)
                    _client = LcRest.PublicUserProfile.GetForInternalUse(posting.userID);
                return _client;
            }
        }

        public string serviceProfessionalMessage
        {
            get
            {
                return LcRest.UserPosting.GetServiceProfessionalReactionMessage(posting.userPostingID, serviceProfessionalID);
            }
        }

        public string viewAuthorPostingURL
        {
            get
            {
                return LcUrl.AppUrl + "posting/" + posting.userPostingID;
            }
        }

        public PostingEmailInfo(int userID, int userPostingID, int serviceProfessionalID)
        {
            posting = LcRest.UserPosting.Get(userID, userPostingID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(), false);
            this.serviceProfessionalID = serviceProfessionalID;
        }
    }

    public static PostingEmailInfo GetPostingInfo()
    {
        var userID = Request["userID"].AsInt();
        var postid = Request["userPostingID"].AsInt();
        var pid = Request["serviceProfessionalUserID"].AsInt();
        return new PostingEmailInfo(userID, postid, pid);
    }
    #endregion
}
