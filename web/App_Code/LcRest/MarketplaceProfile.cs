﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// Marketplace profile information from a subset of [users] table
    /// for the REST API, and static methods for database
    /// operations
    /// </summary>
    public class MarketplaceProfile
    {
        #region Fields
        public int userID;

        public string publicBio;

        public string businessName;
        /// <summary>
        /// Slug or URL fragment choosen by the service professional
        /// as a custom URL belonging the loconomics.com.au domain.
        /// About the slug term: https://en.wikipedia.org/wiki/Semantic_URL#Slug
        /// </summary>
        public string serviceProfessionalProfileUrlSlug;
        /// <summary>
        /// This full URL is not editable directly, just
        /// a computed using the Loconomics URL and
        /// the service professional choosen 'slug', or fallback
        /// to the standard URL.
        /// </summary>
        public string serviceProfessionalProfileUrl
        {
            get
            {
                var url = BuildServiceProfessionalCustomURL(serviceProfessionalProfileUrlSlug);
                if (String.IsNullOrWhiteSpace(url))
                {
                    // Gets the standard, base URL provided by Loconomics.
                    // It's a SEO friendly URL that additionally to the userID
                    // contains information like the city and the primary
                    // job title name (if some information is missed it fallbacks
                    // to the non-SEO, ID based, URL, ever a valid address).
                    return LcUrl.SiteUrl + LcData.UserInfo.GetUserPublicSeoUrlPath(this.userID);
                }
                else
                {
                    return url;
                }
            }
        }
        /// <summary>
        /// A full URL outside Loconomics for
        /// a professional website of the serviceProfessional.
        /// </summary>
        public string serviceProfessionalWebsiteUrl;
        public string bookCode;

        // Like in UserProfile:
        // Automatic field right now, but is better
        // to communicate it than to expect the App or API client
        // to build it. It allows for future optimizations, like
        // move to static content URLs.
        public string photoUrl
        {
            get
            {
                return LcUrl.AppUrl + LcRest.Locale.Current.ToString() + "/Profile/Photo/" + userID + "?v=" + updatedDate.ToString("s");
            }
        }
        public bool hasUploadedPhoto;

        public DateTime createdDate;
        public DateTime updatedDate;
        #endregion

        public static MarketplaceProfile FromDB(dynamic record)
        {
            if (record == null) return null;
            return new MarketplaceProfile
            {
                userID = record.userID,
                publicBio = record.publicBio,
                businessName = record.businessName,
                serviceProfessionalProfileUrlSlug = record.serviceProfessionalProfileUrlSlug,
                serviceProfessionalWebsiteUrl = record.serviceProfessionalWebsiteUrl,
                bookCode = record.bookCode,
                hasUploadedPhoto = record.hasUploadedPhoto,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate
            };
        }

        public const string CustomUrlPrefix = "-";

        public static string BuildServiceProfessionalCustomURL(string slug)
        {
            if (String.IsNullOrWhiteSpace(slug))
                return "";
            else
                return LcUrl.AppUrl + CustomUrlPrefix + ASP.LcHelpers.StringSlugify(slug);
        }

        #region SQL
        private const string sqlSelectProfile = @"
        SELECT TOP 1
            Users.userID

            ,publicBio
            ,businessName
            ,providerProfileUrl as serviceProfessionalProfileUrlSlug
            ,providerWebsiteUrl as serviceProfessionalWebsiteUrl
            ,bookCode   
            ,CASE WHEN Users.Photo IS NULL THEN Cast(0 as bit) ELSE Cast(1 as bit) END As hasUploadedPhoto
                        
            ,createdDate
            ,updatedDate
        FROM Users
                INNER JOIN
            UserProfile As UP
                ON UP.UserID = Users.UserID
        WHERE Users.UserID = @0
            AND Active = 1
    ";

        private const string sqlUpdateProfile = @"
        DECLARE 
        @UserID int
        ,@PublicBio varchar(4000)
        ,@BusinessName nvarchar(145)
        ,@ProviderProfileURLSlug varchar(2078)
        ,@ProviderWebsiteURL varchar(2078)

        SET @UserID = @0
        SET @PublicBio = @1
        SET @BusinessName = @2
        SET @ProviderProfileURLSlug = @3
        SET @ProviderWebsiteURL = @4

        UPDATE	Users
        SET     PublicBio = @PublicBio
		        ,BusinessName = @BusinessName
		        ,ProviderProfileURL = @ProviderProfileURLSlug
		        ,ProviderWebsiteURL = @ProviderWebsiteURL

                ,UpdatedDate = getdate()
                ,ModifiedBy = 'sys'
        WHERE   UserId = @UserID

        EXEC TestAlertPublicBio @UserID
    ";
        #endregion

        #region Fetch
        public static MarketplaceProfile Get(int userID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var profile = FromDB(db.QuerySingle(sqlSelectProfile, userID));

                // Book Code: must be checked if exists or auto create one.
                // NOTE: BookCode generation was added to the LcAuth.BecomeProvider process,
                // so with the time this check will not be need (previously, not all provider
                // accounts were created with BecomeProvider and that didn't create the BookCode for a while.
                if (String.IsNullOrWhiteSpace(profile.bookCode))
                {
                    profile.bookCode = LcData.UserInfo.GenerateBookCode(userID);
                    db.Execute("UPDATE Users SET BookCode = @1 WHERE UserID = @0", userID, profile.bookCode);
                }

                return profile;
            }
        }
        #endregion

        #region Update
        public static void Set(MarketplaceProfile profile)
        {
            using (var db = Database.Open("sqlloco"))
            {
                db.Execute(sqlUpdateProfile,
                    profile.userID,
                    profile.publicBio,
                    profile.businessName,
                    profile.serviceProfessionalProfileUrlSlug,
                    profile.serviceProfessionalWebsiteUrl
                );
            }
        }
        #endregion

        #region Constraints
        private const string sqlCheckProfileUrlAvailabiality = @"
        SELECT  count(*)
        FROM    users
        WHERE   UserID <> @0
                AND ProviderProfileURL like @1
    ";

        public static bool IsProfileUrlAvailable(int userID, string profileUrlSlug)
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Check that profile-url is not in use by other provider, but discarding in the check the own user
                return (
                    String.IsNullOrWhiteSpace(profileUrlSlug) ||
                    db.QueryValue(sqlCheckProfileUrlAvailabiality, userID, profileUrlSlug) == 0
                );
            }
        }
        #endregion
    }
}