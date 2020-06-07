using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Public data for a search result querying for all service professionals of a specific job-title within a limited search distance of the user
    /// </summary>
    public class ServiceProfessionalSearchResult
    {
        #region Fields
        public int userID;
        public int jobTitleID;
        public string firstName;
        public string lastName;
        public string lastInitial;
        public string publicBio;
        public string businessName;
        public bool instantBooking;
        public string jobTitleNameSingular;
        public string otherJobTitles;
        public string allJobTitles;
        public double distance;

        private LcRest.ServiceProfessionalService.Visibility clientVisibility;

        /// <summary>
        /// Same as in PublicUserProfile
        /// Automatic field right now, but is better
        /// to communicate it than to expect the App or API client
        /// to build it. It allows for future optimizations, like
        /// move to static content URLs.
        /// </summary>
        public string photoUrl
        {
            get
            {
                return LcUrl.AppUrl + LcRest.Locale.Current.ToString() + "/Profile/Photo/" + userID + "?v=" + updatedDate.ToString("s");
            }
        }

        private DateTime updatedDate;
        #endregion

        #region Links
        public PublicUserRating rating;
        public PublicUserVerificationsSummary verificationsSummary;
        public PublicUserStats stats;
        public PublicUserJobStats jobStats;

        public void FillLinks()
        {
            rating = LcRest.PublicUserRating.Get(userID, jobTitleID);
            verificationsSummary = LcRest.PublicUserVerificationsSummary.Get(userID, jobTitleID);
            stats = LcRest.PublicUserStats.Get(userID);
            jobStats = LcRest.PublicUserJobStats.Get(userID, jobTitleID, clientVisibility);
        }
        #endregion

        #region Instances
        public static ServiceProfessionalSearchResult FromDB(dynamic record, LcRest.ServiceProfessionalService.Visibility visibility)
        {
            if (record == null) return null;
            var r = new ServiceProfessionalSearchResult
            {
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                firstName = record.firstName,
                lastName = record.lastName,
                lastInitial = record.lastInitial,
                publicBio = record.publicBio,
                businessName = record.businessName,
                instantBooking = record.instantBooking,
                jobTitleNameSingular = record.jobTitleNameSingular,
                otherJobTitles = record.otherJobTitles,
                allJobTitles = record.allJobTitles,
                distance = record.distance,
                clientVisibility = visibility,
                updatedDate = record.updatedDate
            };
            r.FillLinks();
            return r;
        }
        #endregion

        #region Fetch
        public static IEnumerable<ServiceProfessionalSearchResult> SearchByJobTitleID(int JobTitleID, decimal origLat, decimal origLong, int SearchDistance, Locale locale, LcRest.ServiceProfessionalService.Visibility visibility = null)
        {
            visibility = visibility ?? LcRest.ServiceProfessionalService.Visibility.BookableByPublic();

            using (var db = new LcDatabase())
            {
               return db.Query(@"
                    DECLARE @JobTitleID int
                    SET @JobTitleID = @0
                    DECLARE @origLat DECIMAL(12, 9)
                    SET @origLat=@1
                    DECLARE @origLong DECIMAL(12, 9)
                    SET @origLong=@2
                    DECLARE @SearchDistance int
                    SET @SearchDistance = @3
                    DECLARE @LanguageID int                    
                    SET @LanguageID = @4
                    DECLARE @CountryID int
                    SET @CountryID = @5
                    DECLARE @orig geography = geography::Point(@origLat, @origLong, 4326)

                     SELECT 
                        u.userID,
                        u.updatedDate,
                        p.positionID as JobTitleID,
                        u.firstName,
                        u.lastName,                
                        LEFT(u.lastName, 1) + '.' as lastInitial,
                        u.publicBio,
                        u.businessName,
                        upp.InstantBooking,
                        p.PositionSingular As jobTitleNameSingular,
                        otherJobTitles=LTRIM(STUFF((SELECT ', ' + PositionSingular FROM Positions As P0 INNER JOIN UserProfilePositions As UP0 ON P0.PositionID = UP0.PositionID WHERE UP0.UserID = u.UserID AND P0.LanguageID = @LanguageID AND P0.CountryID = @CountryID AND UP0.StatusID = 1 AND UP0.Active = 1 AND P0.PositionID != @JobTitleID AND P0.Active = 1 AND P0.Approved <> 0 FOR XML PATH('')) , 1 , 1 , '' )),
                        allJobTitles=LTRIM(STUFF((SELECT ', ' + PositionSingular FROM Positions As P0 INNER JOIN UserProfilePositions As UP0 ON P0.PositionID = UP0.PositionID WHERE UP0.UserID = u.UserID AND P0.LanguageID = @LanguageID AND P0.CountryID = @CountryID AND UP0.StatusID = 1 AND UP0.Active = 1 AND P0.Active = 1 AND P0.Approved <> 0 FOR XML PATH('')) , 1 , 1 , '' )),
                        
                        MIN(ROUND(@orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000,1)) as distance
                    FROM dbo.users u 
                    INNER JOIN dbo.userprofilepositions upp 
                        ON u.UserID = upp.UserID 
                    INNER JOIN serviceaddress sa
                        ON sa.UserID = upp.UserID
                        AND sa.PositionID = upp.PositionID
                    INNER JOIN
                        address a
                        ON a.addressID=sa.addressID
                        AND a.CountryID=upp.CountryID
                    INNER JOIN  positions p 
                        ON upp.PositionID = p.PositionID 
                        AND upp.LanguageID = p.LanguageID
                        AND upp.CountryID = p.CountryID 
                    WHERE
                        upp.LanguageID = @LanguageID
                        AND upp.CountryID = @CountryID
                        AND u.Active = 1
                        AND upp.Active = 1
                        AND upp.StatusID = 1
                        AND p.Active = 1
                        AND p.positionID = @JobTitleID
                        AND a.Latitude IS NOT NULL
                        AND a.Longitude IS NOT NULL
                        AND @orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000 <=
                        (CASE WHEN (sa.ServicesPerformedAtLocation = 0 AND sa.ServiceRadiusFromLocation IS NOT NULL) THEN
                        CONVERT(FLOAT, sa.ServiceRadiusFromLocation)
                        ELSE 
                        @SearchDistance
                        END)
                    GROUP BY
                        u.userID,
                        p.positionID,
                        u.firstName,
                        u.lastName,
                        u.publicBio,
                        u.businessName,
                        upp.InstantBooking,
                        p.PositionSingular,
                        u.updatedDate
                    ", JobTitleID, origLat, origLong, SearchDistance, locale.languageID, locale.countryID)
                    .Select(x => (ServiceProfessionalSearchResult)FromDB(x, visibility));
            }
        }
        public static IEnumerable<ServiceProfessionalSearchResult> SearchBySearchTerm(string SearchTerm, decimal origLat, decimal origLong, int SearchDistance, Locale locale, LcRest.ServiceProfessionalService.Visibility visibility = null)
        {
            visibility = visibility ?? LcRest.ServiceProfessionalService.Visibility.BookableByPublic();

            using (var db = new LcDatabase())
            {
               return db.Query(@"
                    DECLARE @SearchTerm varchar(150)
                    SET @SearchTerm = @0
                    DECLARE @origLat DECIMAL(12, 9)
                    SET @origLat=@1
                    DECLARE @origLong DECIMAL(12, 9)
                    SET @origLong=@2
                    DECLARE @SearchDistance int
                    SET @SearchDistance = @3
                    DECLARE @LanguageID int                    
                    SET @LanguageID = @4
                    DECLARE @CountryID int
                    SET @CountryID = @5
                    DECLARE @orig geography = geography::Point(@origLat, @origLong, 4326)

                 SELECT 
                        u.userID,
                        u.updatedDate,
                        jobTitleID = -2,
                        u.firstName,
                        u.lastName,                
                        LEFT(u.lastName, 1) + '.' as lastInitial,
                        u.publicBio,
                        u.businessName,
                        Cast(0 as bit) as instantBooking,
                        null As jobTitleNameSingular,
                        otherJobTitles=LTRIM(STUFF((SELECT ', ' + PositionSingular FROM Positions As P0 INNER JOIN UserProfilePositions As UP0 ON P0.PositionID = UP0.PositionID WHERE UP0.UserID = u.UserID AND P0.LanguageID = @LanguageID AND P0.CountryID = @CountryID AND UP0.StatusID = 1 AND UP0.Active = 1 AND P0.Active = 1 AND P0.Approved <> 0 FOR XML PATH('')) , 1 , 1 , '' )),
                        allJobTitles=LTRIM(STUFF((SELECT ', ' + PositionSingular FROM Positions As P0 INNER JOIN UserProfilePositions As UP0 ON P0.PositionID = UP0.PositionID WHERE UP0.UserID = u.UserID AND P0.LanguageID = @LanguageID AND P0.CountryID = @CountryID AND UP0.StatusID = 1 AND UP0.Active = 1 AND P0.Active = 1 AND P0.Approved <> 0 FOR XML PATH('')) , 1 , 1 , '' )),
                        MIN(ROUND(@orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000,1)) as distance
                    FROM dbo.users u 
                    INNER JOIN dbo.userprofilepositions upp 
                        ON u.UserID = upp.UserID 
                    INNER JOIN serviceaddress sa
                        ON sa.UserID = upp.UserID
                        AND sa.PositionID = upp.PositionID
                    INNER JOIN
                        address a
                        ON a.addressID=sa.addressID
                        AND a.CountryID=upp.CountryID
                    INNER JOIN  positions p 
                        ON upp.PositionID = p.PositionID 
                        AND upp.LanguageID = p.LanguageID
                        AND upp.CountryID = p.CountryID 
                    WHERE
                        upp.LanguageID = @LanguageID
                        AND upp.CountryID = @CountryID
                        AND u.Active = 1
                        AND upp.Active = 1
                        AND upp.StatusID = 1
                        AND p.Active = 1
                        AND (u.FirstName like @SearchTerm
                        OR u.LastName like @SearchTerm
                        OR u.BusinessName like @SearchTerm)
                        AND a.Latitude IS NOT NULL
                        AND a.Longitude IS NOT NULL
                        AND @orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000 <=
                        (CASE WHEN (sa.ServicesPerformedAtLocation = 0 AND sa.ServiceRadiusFromLocation IS NOT NULL) THEN
                        CONVERT(FLOAT, sa.ServiceRadiusFromLocation)
                        ELSE 
                        @SearchDistance
                        END)
                    GROUP BY
                        u.userID,
                        u.firstName,
                        u.lastName,
                        u.publicBio,
                        u.businessName,
                        u.updatedDate
                    ", "%" + SearchTerm + "%", origLat, origLong, SearchDistance, locale.languageID, locale.countryID)
                    .Select(x => (ServiceProfessionalSearchResult)FromDB(x, visibility));
            }
        }
        #endregion
    }
}