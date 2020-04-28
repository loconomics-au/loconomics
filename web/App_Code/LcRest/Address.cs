using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Web.WebPages;

namespace LcRest
{
    /// <summary>
    /// Implements the scheme for a 'service-address' object
    /// in the REST API, and static methods for database
    /// operations
    /// </summary>
    public class Address
    {
        #region Fields
        public int addressID;
        public int jobTitleID;
        public int userID;
        public string addressName;
        public string addressLine1;
        public string addressLine2;
        private int postalCodeID;
        public string postalCode;
        public string city;
        internal int stateProvinceID;
        public string stateProvinceCode;
        public string stateProvinceName;
        internal int countryID;
        public string countryCode;
        public double? latitude;
        public double? longitude;
        public string specialInstructions;
        public bool isServiceLocation;
        public bool isServiceArea;
        public decimal? serviceRadius;
        public DateTime createdDate;
        public DateTime updatedDate;
        /// <summary>
        /// A valid AddressKind string.
        /// </summary>
        public string kind;
        /// <summary>
        /// UserID of the user that created the address. Usually the same as userID.
        /// </summary>
        public int createdBy;
        #endregion

        #region Enums
        public const int NotAJobTitleID = 0;

        public const int NewAddressID = 0;
        public const int NotAnAddressID = 0;

        /// <summary>
        /// Internal address type, used in database but not exposed
        /// in the REST API.
        /// </summary>
        public enum AddressType : short
        {
            Home = 1,
            Billing = 13,
            Other = 12
        }
        /// <summary>
        /// Public address kind enumeration (string is not valid as Enum, so static
        /// class with prefixed values per public const property).
        /// Its needed to properly mark and expose each kind of
        /// address that can exists in the API (a bit like the 'special types'
        /// that were inconsistently managed with the AddressType).
        /// Let each returned address to be clearly identified
        /// inside the API. The numeric values are only internal
        /// is expected to expose as text.
        /// 
        /// NOTE: Maybe an actual enum can be created using toString() to produce
        /// the string value? Any assigned numeric value is not wanted just a side effect
        /// </summary>
        public static class AddressKind
        {
            #region Valid Property Values
            public const string Home = "home";
            public const string Billing = "billing";
            public const string Service = "service";
            #endregion

            #region Utils
            private static List<string> List = new List<string> { "home", "billing", "service" };

            public static bool IsValid(string kind)
            {
                return List.Contains(kind);
            }

            public static string GetFromAddressDBRecord(dynamic address)
            {
                var addressTypeID = (int)address.addressTypeID;
                var jobTitleID = (int)address.jobTitleID;

                // It is attached to a job title (>0), doesn't matters
                // the typeID, is treated ever as a 'service' address.
                if (jobTitleID > 0)
                {
                    return Service;
                }
                else
                {
                    switch (addressTypeID)
                    {
                        case (short)AddressType.Home:
                            return Home;
                        case (short)AddressType.Billing:
                            return Billing;
                        default:
                            // Its really strange to end here (not if the data is consistent)
                            // but any way, under any corrupted data or something, treated
                            // like a service address
                            return Service;
                    }
                }
            }
            #endregion
        }
        #endregion

        #region Instances
        public static Address FromDB(dynamic record)
        {
            if (record == null) return null;
            return new Address
            {
                addressID = record.addressID,
                jobTitleID = record.jobTitleID,
                userID = record.userID,
                addressName = record.addressName,
                addressLine1 = record.addressLine1,
                addressLine2 = record.addressLine2,
                postalCodeID = record.postalCodeID,
                postalCode = record.postalCode,
                city = record.city,
                stateProvinceID = record.stateProvinceID,
                stateProvinceCode = record.stateProvinceCode,
                stateProvinceName = record.stateProvinceName,
                countryID = record.countryID,
                countryCode = record.countryCode,
                latitude = record.latitude,
                longitude = record.longitude,
                specialInstructions = record.specialInstructions,
                isServiceLocation = record.isServiceLocation,
                isServiceArea = record.isServiceArea,
                serviceRadius = N.D(record.serviceRadius) == null ? null : DataTypes.GetTypedValue<decimal?>(record.serviceRadius, 0),
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                kind = AddressKind.GetFromAddressDBRecord(record),
                createdBy = record.createdBy
            };
        }
        #endregion

        #region Instance Util Methods
        public bool IsNewAddress()
        {
            return addressID == NewAddressID;
        }

        /// <summary>
        /// Checks if current address data is empty in all user fields. It doesn't checks fields like addressID, or timestamps.
        /// This is useful to read data given by a user into an Address instance
        /// and check if the user passed in some data or not, on the case of not we
        /// may check if a given addressID was given, that means the user wants to use
        /// that ID without update the address data.
        /// </summary>
        /// <returns></returns>
        public bool IsEmpty()
        {
            return (
                String.IsNullOrWhiteSpace(this.addressLine1) &&
                String.IsNullOrWhiteSpace(this.addressLine2) &&
                String.IsNullOrWhiteSpace(this.addressName) &&
                String.IsNullOrWhiteSpace(this.postalCode) &&
                String.IsNullOrWhiteSpace(this.specialInstructions) &&
                !this.latitude.HasValue &&
                !this.longitude.HasValue
            );
        }

        /// <summary>
        /// Checks if current address and the given address are similar, by checking if the
        /// values at user editable fields are the same.
        /// It's not an 'IsEqual' comparision because not all fields (addressID, timestamps) are checked.
        /// </summary>
        public bool IsSimilar(Address other) {
            return (
                this.addressLine1 == other.addressLine1 &&
                this.addressLine2 == other.addressLine2 &&
                this.addressName == other.addressName &&
                this.postalCode == other.postalCode &&
                this.specialInstructions == other.specialInstructions &&
                this.latitude == other.latitude &&
                this.longitude == other.longitude
            );
        }

        public bool IsAnonymous()
        {
            return String.IsNullOrWhiteSpace(this.addressName);
        }

        public bool IsCreatedByItself()
        {
            return this.createdBy == 0 || this.userID == this.createdBy;
        }
        #endregion

        #region SQL
        private const string sqlSelect = @"SELECT ";
        private const string sqlSelectOne = @"SELECT TOP 1 ";
        private const string sqlFields = @"
                L.AddressID as addressID
                ,L.UserID as userID
                ,coalesce(SA.PositionID, 0) as jobTitleID
                ,L.AddressName as addressName
                ,L.AddressLine1 as addressLine1
                ,L.AddressLine2 as addressLine2

                ,L.PostalCodeID as postalCodeID
                ,PC.PostalCode as postalCode
                ,L.City as city
                ,L.StateProvinceID as stateProvinceID
                ,SP.StateProvinceCode as stateProvinceCode
                ,SP.StateProvinceName as stateProvinceName
                ,L.CountryID as countryID
                ,C.CountryCodeAlpha2 as countryCode

                ,L.Latitude as latitude
                ,L.Longitude as longitude
                ,L.SpecialInstructions as specialInstructions

                ,coalesce(SA.ServicesPerformedAtLocation, Cast(0 as bit)) as isServiceLocation
                ,coalesce(SA.TravelFromLocation, Cast(0 as bit)) as isServiceArea
                ,SA.ServiceRadiusFromLocation as serviceRadius

                ,L.CreatedDate as createdDate
                ,CASE WHEN SA.UpdatedDate is null OR L.UpdatedDate > SA.UpdatedDate THEN L.UpdatedDate ELSE SA.UpdatedDate END as updatedDate

                ,L.AddressTypeID as addressTypeID

                ,L.CreatedBy as createdBy

            FROM    Address As L
                     INNER JOIN
                    StateProvince As SP
                      ON L.StateProvinceID = SP.StateProvinceID
                     INNER JOIN
                    PostalCode As PC
                      ON PC.PostalCodeID = L.PostalCodeID
                     INNER JOIN
                    Country As C
                      ON L.CountryID = C.CountryID
                        AND C.LanguageID = @0
                     LEFT JOIN
                    ServiceAddress As SA
                      -- Special case when the jobtitle/position requested is zero
                      -- just dont let make the relation to avoid bad results
                      -- because of internally reused addressID.
                      ON @2 <> -1 AND L.AddressID = SA.AddressID
            WHERE   L.Active = 1
        ";
        private const string sqlAndUserID = @" AND L.UserID = @1 ";
        private const string sqlAndJobTitleID = @"
            AND coalesce(SA.PositionID, 0) = @2
        ";
        private const string sqlAndAddressID = @"
            AND L.AddressID = @3
        ";
        private const string sqlAndTypeID = @"
            AND L.AddressTypeID = @4
        ";
        private const string sqlcondOnlyNamedAddresses = @"
            AND L.AddressName is not null AND L.AddressName not like ''
        ";
        private const string sqlAndCreatedBy = @" AND L.CreatedBy = @3";
        private const string sqlAndCreatedByItself = @" AND L.CreatedBy = L.UserID";
        // Since user can delete addresses from being available on its list but still
        // we need preserve that addresses information for cases in that is linked to 
        // a booking, that addresses get 'soft deleted', changing its flags for kind
        // of location to false, then we only show addresses with almost one flag.
        // NOTE: Its public because is used externally on webpages, since initially was
        // there and to avoid duplicated is just linked from there right now.
        public const string sqlcondOnlyActiveServiceAddress = " AND (TravelFromLocation = 1 OR ServicesPerformedAtLocation = 1)";
        /// <summary>
        /// Parameter @0 the UserID.
        /// </summary>
        public static readonly string sqlGetHomeAddressID = @"
        SELECT  AddressID
        FROM    Address
        WHERE   UserID = @0
                AND Active = 1
                AND AddressTypeID = " + ((short)AddressType.Home).ToString()
        ;
        #endregion

        #region Fetch
        public static List<Address> GetServiceAddresses(int userID, int jobTitleID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var sql = sqlSelect + sqlFields + sqlAndCreatedByItself + sqlAndUserID + sqlAndJobTitleID + (jobTitleID > 0 ? sqlcondOnlyActiveServiceAddress : sqlcondOnlyNamedAddresses);
                return db.Query(sql,
                    LcData.GetCurrentLanguageID(), userID, jobTitleID)
                    .Select(FromDB)
                    .ToList();
            }
        }

        public static List<Address> GetBillingAddresses(int userID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Parameter jobTitleID needs to be specified as 0 to avoid to join
                // the service-address table
                // Null value as 3th parameter since that placeholder is reserved for addressID
                return db.Query(sqlSelect + sqlFields + sqlAndCreatedByItself + sqlAndUserID + sqlAndJobTitleID + sqlAndTypeID,
                    LcData.GetCurrentLanguageID(), userID, NotAJobTitleID, null, AddressType.Billing)
                    .Select(FromDB)
                    .ToList();
            }
        }

        /// <summary>
        /// Get the list of active service addresses created by a given user on behalf of another user, optionally for a specific
        /// jobTitleID
        /// </summary>
        /// <param name="createdByUserID"></param>
        /// <param name="onBehalfOfUserID"></param>
        /// <param name="jobTitleID"></param>
        /// <returns></returns>
        public static IEnumerable<Address> GetAddressesCreatedByOnBehalfOf(int createdByUserID, int onBehalfOfUserID, int jobTitleID = 0)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var sql = sqlSelect + sqlFields + sqlAndUserID + sqlcondOnlyActiveServiceAddress;
                if (jobTitleID > 0)
                {
                    sql += sqlAndJobTitleID;
                }
                sql += sqlAndCreatedBy;
                return db.Query(sql,
                    LcData.GetCurrentLanguageID(), onBehalfOfUserID, jobTitleID, createdByUserID)
                    .Select(FromDB);
            }
        }

        private static Address GetSingleFrom(IEnumerable<dynamic> dbRecords)
        {
            var add = dbRecords
                .Select(FromDB)
                .ToList();

            if (add.Count == 0)
                return null;
            else
                return add[0];
        }

        public static Address GetServiceAddress(int userID, int jobTitleID, int addressID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return GetSingleFrom(db.Query(
                    sqlSelectOne + sqlFields + sqlAndCreatedByItself + sqlAndUserID + sqlAndJobTitleID + sqlAndAddressID + sqlcondOnlyActiveServiceAddress,
                    LcData.GetCurrentLanguageID(), userID, jobTitleID, addressID
                ));
            }
        }

        /// <summary>
        /// Returns the address for the ID only if is owned by one of the given userIds.
        /// This is usefull at bookings, when the address for the service can be a service professional service address
        /// or a personal client address, there is no knowledgment of who is the owner in the booking info so 
        /// can be any of both.
        /// </summary>
        /// <param name="addressID"></param>
        /// <param name="anyFromUserIds"></param>
        /// <returns></returns>
        public static Address GetAddress(int addressID, IEnumerable<int> anyFromUserIds)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var idList = String.Join(",", anyFromUserIds);
                var sqlAndUserIdInList = " AND L.UserID IN (" + idList + ") ";
                return GetSingleFrom(db.Query(
                    sqlSelectOne + sqlFields + sqlAndUserIdInList + sqlAndAddressID,
                    LcData.GetCurrentLanguageID(),
                    null, // There is no @1 on this SQL
                    NotAJobTitleID, // @2 has special meaning on the SQL, avoid some bad results
                    addressID
                ));
            }
        }

        public static Address GetBillingAddress(int userID, int addressID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Parameter jobTitleID needs to be specified as 0 to avoid to join
                // the service-address table
                return GetSingleFrom(db.Query(
                    sqlSelectOne + sqlFields + sqlAndCreatedByItself + sqlAndUserID + sqlAndJobTitleID + sqlAndAddressID + sqlAndTypeID,
                    LcData.GetCurrentLanguageID(), userID, NotAJobTitleID, addressID, AddressType.Billing
                ));
            }
        }

        public static Address GetHomeAddress(int userID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Parameter jobTitleID needs to be specified as 0 to avoid to join
                // the service-address table
                // Null value as 3th parameter since that placeholder is reserved for addressID
                // NOTE: Home address must exists ever, if there is no one on databsae but
                // user exists, just default/null values per field are returned but a record
                // is returned.
                var add = GetSingleFrom(db.Query(
                    sqlSelectOne + sqlFields + sqlAndCreatedByItself + sqlAndUserID + sqlAndTypeID,
                    LcData.GetCurrentLanguageID(), userID, null, null, AddressType.Home
                ));

                if (add == null)
                {
                    add = new Address
                    {
                        // L10N
                        addressName = "Home",
                        userID = userID,
                        kind = AddressKind.Home
                    };
                }
                return add;
            }
        }
        #endregion

        #region Delete
        /// <summary>
        /// Delete an address, or transparently 'soft delete' if is linked internally.
        /// BE CAREFUL that this does not check for what kind of address is to delete,
        /// on the REST API or any other preliminar checks must be done to ensure
        /// the address can be deleted (like a service from the service API
        /// and a billing from the billing API; the home address is treated special
        /// internally and is not allowed to be deleted -because of [UniquePerUser]-; for a time, the billing
        /// address will not too, but that can change with the time).
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="addressID"></param>
        public static void DelAddress(int userID, int jobTitleID, int addressID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Some old logics apply here because of the Dashboard up to v6, 
                // like the last parameter with "both".
                db.Execute(LcData.sqlDelServiceAddress, addressID, userID, jobTitleID, "both");
            }
        }
        #endregion

        #region Constraints
        /// <summary>
        /// Returns true if is allowed to add a new address that is a service area.
        /// Constraint: only one service area is allowed at this time.
        ///
        /// Original notes:
        /// Validate that 'travel from location' is unique
        /// Issue #86, details. for now, only allow one 'travel from' location for a simpler client visualization of provider working zones.
        /// 
        /// Update 2015-03-07: Per comments on #677 2015-03-07 (following https://github.com/joshdanielson/Loconomics/issues/677#issuecomment-77714980),
        /// this contraint is not used with the creation of the App and the REST API, but code is preserved (the call to this function was
        /// commented on the RestPage).
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="addressID"></param>
        /// <returns></returns>
        public static bool IsNewServiceAreaAllowed(int userID, int jobTitleID, int addressID)
        {
            using (var db = Database.Open("sqlloco"))
            {

                return db.QueryValue(@"
                SELECT count(*) FROM ServiceAddress
                WHERE UserID = @0 AND PositionID = @1
                        AND TravelFromLocation = 1 -- Only travel from addresses
                        AND AddressID <> @2 --Don't count this address!
                        AND CreatedBy = UserID
            ", userID, jobTitleID, addressID) == 0;
            }
        }

        /// <summary>
        /// Checks if the provided addressID belongs to ALMOST ONE of the UserIDs provided.
        /// </summary>
        /// <param name="addressID"></param>
        /// <param name="userIds"></param>
        /// <returns></returns>
        public static bool ItBelongsTo(int addressID, params int[] userIds)
        {
            using (var db = new LcDatabase())
            {
                var ownerUserID = (int?)db.QueryValue(@"
                    SELECT userID FROM Address WHERE AddressID = @0
                ", addressID);
                if (ownerUserID.HasValue)
                {
                    foreach (var userID in userIds)
                    {
                        if (ownerUserID.Value == userID)
                            return true;
                    }
                }
            }
            return false;
        }
        #endregion

        #region Create/Update
        public static int SetAddress(Address address, Database sharedDb = null)
        {
            // Inferred TypeID
            var internalTypeID = AddressType.Other;
            switch (address.kind)
            {
                case AddressKind.Home:
                    internalTypeID = AddressType.Home;
                    if (String.IsNullOrEmpty(address.addressName))
                    {
                        address.addressName = "Home";
                    }
                    break;
                case AddressKind.Billing:
                    internalTypeID = AddressType.Billing;
                    break;
                // Any other kind (Service), is already set to 'Other'.
            }

            // Automatically set the City, StateProvinceID and PostalCodeID given
            // the PostalCode and Country information from the object.
            if (!String.IsNullOrEmpty(address.postalCode) && !AutosetByCountryPostalCode(address))
            {
                // TODO l10n
                throw new ValidationException("[[[Invalid postal code]]]", "postalCode", "address");
            }

            // GPS
            if ((!address.latitude.HasValue || address.latitude.Value == 0) &&
                (!address.longitude.HasValue || address.longitude.Value == 0) &&
                !String.IsNullOrEmpty(address.postalCode))
            {
                var addressInline = ASP.LcHelpers.JoinNotEmptyStrings(", ",
                    address.addressLine1,
                    address.addressLine2,
                    address.city,
                    address.postalCode,
                    address.stateProvinceCode,
                    address.countryCode
                );

                var latLng = LcData.Address.GoogleGeoCode(addressInline);

                if (latLng != null)
                {
                    address.latitude = (double)latLng.Lat;
                    address.longitude = (double)latLng.Lng;
                }
                else
                {
                    // Per comment on #677 2015-03-07 (following https://github.com/joshdanielson/Loconomics/issues/677#issuecomment-77714980)
                    // The constraint that makes GPS required is removed but with code copy, so next lines are commented:
                    // // Coordinates are required
                    // throw new HttpException(404, "Looks like we're having problems verifying this location. Please double-check it or use the pin to choose a location.");
                }
            }

            // Presets
            // If is a service area location and has no name, put automatically a name:
            if (address.isServiceArea &&
                String.IsNullOrWhiteSpace(address.addressName))
            {
                // TODO l10n preset address name for service area addresses
                address.addressName = "[[[Service Area]]]";
            }

            using (var db = new LcDatabase(sharedDb))
            {

                // Different SQL for service addresses.
                // Despite of that, we pass later all the service
                // parameters, since they will be just discarded
                // by the placeholder replacement, and the sort
                // of the standard address fields is the same
                // since the SQL for that part is the same
                // in the service-address sql.
                var sql = address.kind == AddressKind.Service ?
                    LcData.sqlSetServiceAddress :
                    LcData.sqlSetAddress
                ;

                // Special: for the kind 'home' we need to set the addressID
                // that exists on database (it behaves a bit like a 'singleton',
                // and its ID is not know when the update is requested
                // If for some internal disaster it does not exists, use 0
                // to create one. and fix that :-)
                if (address.kind == AddressKind.Home)
                {
                    address.addressID = (int)(N.D(db.QueryValue(sqlGetHomeAddressID, address.userID)) ?? NewAddressID);
                }

                return (int)db.QueryValue(sql,
                    address.addressID,
                    address.userID,
                    // Cannot be null on database, but can be empty on some addresses (service radius)
                    address.addressLine1 ?? "",
                    address.addressLine2,
                    address.city ?? "",
                    address.stateProvinceID,
                    address.postalCodeID,
                    address.countryID,
                    address.addressName,
                    internalTypeID,
                    address.specialInstructions,
                    address.latitude,
                    address.longitude,
                    null, // old unused field "google-map-url",
                    address.createdBy == 0 ? address.userID : address.createdBy,
                    // Beggining of service-address specific fields:
                    address.jobTitleID,
                    address.isServiceLocation,
                    address.isServiceArea,
                    address.serviceRadius,
                    null, // unused field on REST "travel-transport",
                    false // unused field on REST "preferred-address"
                );
            }
        }
        #endregion

        #region Look up tasks
        /// <summary>
        /// List used at AutosetByCountryPostalCode to apply validation only on full supported countries
        /// TODO Update country filtering when postal code validation gets enabled for other countries.
        /// </summary>
        static readonly List<int> countryIdsWithPostalCodeValidation = new List<int>
        {
            1, // US
            15 // Australia
        };
        /// <summary>
        /// For an address with the Country (code or ID) and Postal Code information,
        /// it looks in database for the PostalCodeID, City and StateProvinceID and 
        /// set it in the passed address object.
        /// If the initial address contains a Country Code but not ID, the ID is
        /// auto set too.
        /// 
        /// It throws ValidationException if the required postal code and country information
        /// does not exists in the address object.
        /// </summary>
        /// <param name="address"></param>
        /// <returns>The success of the task.</returns>
        public static bool AutosetByCountryPostalCode(Address address)
        {
            if (address.countryID <= 0)
            {
                if (String.IsNullOrWhiteSpace(address.countryCode))
                {
                    // TODO l10n
                    throw new ValidationException("[[[Address must contain a country code or country ID]]]", "countryCode", "address");
                }
                address.countryID = LcRest.Locale.GetCountryIDByCode(address.countryCode);
            }
            else
            {
                // Just ensure the Country Code is the correct for the given ID
                if (address.countryCode == null)
                    address.countryCode = LcRest.Locale.GetCountryCodeByID(address.countryID);
            }

            // IMPORTANT: For now, only validate Postal Code for US and Australia since we only have that list complete, on the other
            // cases we set some values to empty when null to avoid database not-null constraint errors.
            if (countryIdsWithPostalCodeValidation.Contains(address.countryID))
            {
                if (String.IsNullOrWhiteSpace(address.postalCode))
                {
                    // TODO l10n
                    throw new ValidationException("[[[Address must contain a postal code]]]", "postalCode", "address");
                }

                // Get the information by postal code and country from database
                var data = GetPostalCodeData(address.postalCode, address.countryID, false);
                if (data != null)
                {
                    address.postalCodeID = data.postalCodeID;
                    address.city = data.city;
                    address.stateProvinceID = data.stateProvinceID;
                    address.stateProvinceCode = data.stateProvinceCode;
                    address.stateProvinceName = data.stateProvinceName;
                    // Done:
                    return true;
                }
                else
                {
                    // Failed look-up
                    return false;
                }
            }
            else
            {
                if (address.city == null)
                    address.city = "";
                return true;
            }
        }

        /// <summary>
        /// TODO: Why not fill the public fields in a !publicInterface call?
        /// </summary>
        /// <param name="postalCode"></param>
        /// <param name="countryID"></param>
        /// <param name="publicInterface"></param>
        /// <returns></returns>
        public static dynamic GetPostalCodeData(string postalCode, int countryID, bool publicInterface)
        {
            // Get the information by postal code and country from database
            var sqlGetPublicPostalCodeData = @"
            SELECT  PC.City As city,
                    SP.StateProvinceCode As stateProvinceCode,
                    SP.StateProvinceName As stateProvinceName
            FROM    PostalCode As PC
                     INNER JOIN
                    StateProvince As SP
                      ON PC.StateProvinceID = SP.StateProvinceID
                          AND PC.CountryID = SP.CountryID
            WHERE   PC.PostalCode = @0
                        AND
                    PC.CountryID = @1
        ";
            var sqlGetPostalCodeData = @"
            SELECT  PC.postalCodeID, PC.city, PC.stateProvinceID,
                    SP.StateProvinceCode As stateProvinceCode,
                    SP.StateProvinceName As stateProvinceName
            FROM    PostalCode As PC
                     INNER JOIN
                    StateProvince As SP
                      ON PC.StateProvinceID = SP.StateProvinceID
                          AND PC.CountryID = SP.CountryID
            WHERE   PC.PostalCode = @0
                        AND
                    PC.CountryID = @1
        ";
            using (var db = Database.Open("sqlloco"))
            {
                var data = db.QuerySingle(publicInterface ? sqlGetPublicPostalCodeData : sqlGetPostalCodeData, postalCode, countryID);
                if (data != null)
                {
                    return data;
                }
                else
                {
                    // Failed look-up
                    return null;
                }
            }
        }
        #endregion
    }
}