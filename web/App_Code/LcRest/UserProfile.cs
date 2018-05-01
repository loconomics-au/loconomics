﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// User profile information from a subset of [users] table
    /// for the REST API, and static methods for database
    /// operations
    /// </summary>
    public class UserProfile
    {
        #region Fields
        public int userID;
        public string email;

        public string firstName;
        public string lastName;
        public string secondLastName;
        public string businessName;

        public string alternativeEmail;
        public string phone;
        public bool canReceiveSms;
        public int? birthMonthDay;
        public int? birthMonth;

        public bool isServiceProfessional;
        public bool isClient;
        public bool isCollaborator;
        public bool isAdmin;

        /// <summary>
        /// Used in the app with a different set of names, but the first one is the same: 'welcome'.
        /// </summary>
        public string onboardingStep;
        public int accountStatusID;
        public DateTime createdDate;
        public DateTime updatedDate;
        public int countryID;
        public int languageID;

        [JsonIgnore]
        public Owner owner;
        public int ownerStatusID
        {
            get
            {
                return owner.statusID;
            }
        }
        public DateTime? ownerAnniversaryDate
        {
            get
            {
                return owner.ownerAnniversaryDate;
            }
        }

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
        #endregion

        public static UserProfile FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserProfile
            {
                userID = record.userID,
                email = record.email,

                firstName = record.firstName,
                lastName = record.lastName,
                secondLastName = record.secondLastName,
                businessName = record.businessName,

                alternativeEmail = record.alternativeEmail,
                phone = record.phone,
                canReceiveSms = record.canReceiveSms,
                birthMonthDay = record.birthMonthDay,
                birthMonth = record.birthMonth,

                isServiceProfessional = record.isServiceProfessional,
                isClient = record.isClient,
                isCollaborator = record.isCollaborator,
                isAdmin = record.isAdmin,

                onboardingStep = record.onboardingStep,
                accountStatusID = record.accountStatusID,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                languageID = record.languageID,
                countryID = record.countryID,

                owner = new Owner
                {
                    userID = record.userID,
                    statusID = record.ownerStatusID ?? (int)Owner.DefaultOwnerStatus,
                    ownerAnniversaryDate = record.ownerAnniversaryDate
                }
            };
        }

        #region SQL
        private const string sqlSelectProfile = @"
        SELECT TOP 1
            -- ID
            Users.userID
            ,UP.email

            -- Name
            ,firstName
            ,lastName
            ,secondLastName
            ,businessName

            -- User Type
            ,isProvider as isServiceProfessional
            ,isCustomer as isClient
            ,isCollaborator
            ,isAdmin

            ,alternativeEmail
            ,mobilePhone as phone
            ,canReceiveSms
            ,birthMonthDay
            ,birthMonth
                        
            ,onboardingStep
            ,accountStatusID
            ,createdDate
            ,updatedDate
            ,PreferredLanguageID as languageID
            ,PreferredCountryID as countryID

            ,ownerStatusID
            ,ownerAnniversaryDate

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
        ,@FirstName varchar(50)
        ,@LastName varchar(145)
        ,@SecondLastName varchar(145)
        ,@businessName nvarchar(145)

        ,@AlternativeEmail nvarchar(56)
        ,@Phone varchar(20)
        ,@CanReceiveSms bit
        ,@BirthMonthDay int
        ,@BirthMonth int

        SET @UserID = @0
        SET @FirstName = @1
        SET @LastName = @2
        SET @SecondLastName = @3
        SET @businessName = @4
        SET @AlternativeEmail = @5
        SET @Phone = @6
        SET @CanReceiveSms = @7
        SET @BirthMonthDay = @8
        SET @BirthMonth = @9

        -- Saving all the data and updating verifications
        BEGIN TRAN

        /* Do checks to revoke verifications on some changes */
        -- @c var allow us check if data is equals (=1) or was changed (=0)
        DECLARE @c int

        -- Checking Full Name: any change?
        SELECT  @c = count(*)
        FROM    Users
        WHERE   UserID = @UserID
                    AND
                FirstName = @FirstName AND LastName = @LastName AND SecondLastName = @SecondLastName

        IF @c = 0 BEGIN
            -- Revoke social verifications (all VerificationCategoryID = 3)
            UPDATE  UserVerification SET
                VerificationStatusID = 3, -- revoked status
                UpdatedDate = getdate()
            WHERE   VerificationID IN (
                        SELECT VerificationID
                        FROM    Verification
                        WHERE   VerificationCategoryID = 3
                    )

            -- Revoke name verification (VerificationID=1)
            UPDATE  UserVerification SET
                VerificationStatusID = 3, -- revoked status
                UpdatedDate = getdate()
            WHERE   VerificationID = 1

            -- Revoke background check verification (VerificationID=7)
            UPDATE  UserVerification SET
                VerificationStatusID = 3, -- revoked status
                UpdatedDate = getdate()
            WHERE   VerificationID = 7
        END

        -- Checking Phone: any change?
        SELECT  @c = count(*)
        FROM    Users
        WHERE   UserID = @UserID
                AND MobilePhone = @Phone

        IF @c = 0 BEGIN
            -- Revoke phone verification (VerificationID=4)
            UPDATE  UserVerification SET
                VerificationStatusID = 3, -- revoked status
                UpdatedDate = getdate()
            WHERE   VerificationID = 4
        END

        /* Update Data */
        UPDATE	Users
        SET     FirstName = @FirstName
		        ,LastName = @LastName
		        ,SecondLastName = @SecondLastName
                ,BusinessName = @businessName

                ,AlternativeEmail = @AlternativeEmail		        
                ,MobilePhone = @Phone
                ,CanReceiveSms = @CanReceiveSms
                ,BirthMonthDay = @BirthMonthDay
                ,BirthMonth = @BirthMonth

                ,UpdatedDate = getdate()
                ,ModifiedBy = 'sys'
        WHERE   UserId = @UserID

        -- A lot of direct and indirect alerts depend on contact info,
        -- execute all its alerts for all its positions
        EXEC TestAllUserAlerts @UserID

        COMMIT TRAN
        ";
        #endregion

        #region Fetch
        public static UserProfile Get(int userID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return FromDB(db.QuerySingle(sqlSelectProfile, userID));
            }
        }

        public static string GetEmail(int userID)
        {
            using (var db = new LcDatabase())
            {
                return (string)db.QueryValue(@"
                    SELECT email FROM UserProfile WHERE UserID = @0
                ", userID);
            }
        }

        public static bool Exists(int userID)
        {
            return Get(userID) != null;
        }
        #endregion

        #region Create/Update
        public static void Set(UserProfile profile)
        {
            using (var db = Database.Open("sqlloco"))
            {

                db.Execute(sqlUpdateProfile,
                    profile.userID,
                    profile.firstName,
                    profile.lastName,
                    profile.secondLastName,
                    profile.businessName,
                    profile.alternativeEmail,
                    profile.phone,
                    profile.canReceiveSms,
                    profile.birthMonthDay,
                    profile.birthMonth
                );
            }
        }
        #endregion

        #region Membership / OwnerStatus
        /// <summary>
        /// Checks the membership requirements of the user and
        /// if there is a status change is saved at database.
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public static LcEnum.OwnerStatus CheckAndSaveOwnerStatus(int userID)
        {
            var owner = Get(userID).owner;
            owner.status = Owner.GetExpectedOwnerStatus(userID);
            Owner.Set(owner);
            return owner.status;
        }
        #endregion
    }
}