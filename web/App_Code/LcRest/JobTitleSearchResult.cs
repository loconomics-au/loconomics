using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// 
    /// </summary>
    public class JobTitleSearchResult
    {
        #region Fields
        public int jobTitleID;
        public string singularName;
        public string pluralName;
        public string description;
        public string searchDescription;
        public decimal? averageRating;
        public long totalRatings;
        public decimal? averageResponseTimeMinutes;
        public decimal? averageHourlyRate;
        public decimal? minServicePrice;
        public decimal? minHourlyRate;
        public string minServiceValue;
        public long serviceProfessionalsCount;
        #endregion

        #region Instances
        public static JobTitleSearchResult FromDB(dynamic record)
        {
            if (record == null) return record;
            return new JobTitleSearchResult
            {
                jobTitleID = record.jobTitleID,
                singularName = record.singularName,
                pluralName = record.pluralName,
                description = record.description,
                searchDescription = record.searchDescription,
                averageRating = record.averageRating,
                totalRatings = record.totalRatings,
                averageResponseTimeMinutes = record.averageResponseTimeMinutes,
                averageHourlyRate = record.averageHourlyRate,
                minServicePrice = record.minServicePrice,
                minHourlyRate = record.minHourlyRate,
                minServiceValue = record.minServiceValue,
                serviceProfessionalsCount = record.serviceProfessionalsCount
            };
        }
        #endregion

        #region Fetch
        public static dynamic SearchByJobTitleAutocomplete(string searchTerm, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(@"
                DECLARE @searchTerm AS varchar(150)
                SET @searchTerm = @0
                DECLARE @LanguageID int  
                SET @LanguageID = @1
                DECLARE @CountryID int
                SET @CountryID = @2

                SELECT TOP 25
                    PositionID as jobTitleID
                    ,PositionSingular as singularName
                    ,PositionDescription as description
                    ,PositionSearchDescription as searchDescription
                FROM
                    positions
                WHERE
                    Active = 1
                    AND LanguageID = @LanguageID
                    AND CountryID = @CountryID
                    AND Approved = 1 
                    AND (PositionSingular like '%' + @searchTerm + '%'
                    OR PositionDescription like '%' + @searchTerm + '%'
                    OR GovPositionDescription like '%' + @searchTerm + '%'
                    OR PositionSearchDescription like '%' + @searchTerm + '%'
                    OR Aliases like '%' + @searchTerm + '%')
                ORDER BY
                    DisplayRank, PositionSingular
                ", searchTerm, locale.languageID, locale.countryID);
            }
        }
        public static JobTitleSearchResult SearchByJobTitleID(int jobTitleID, decimal origLat, decimal origLong, int SearchDistance, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(@"
                    DECLARE @jobTitleID AS int
                    SET @jobTitleID = @0
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
                        P.PositionID as jobTitleID
                        ,P.PositionSingular as singularName
                        ,P.PositionPlural as pluralName
                        ,P.PositionDescription as description
                        ,P.PositionSearchDescription as searchDescription
                        ,CASE WHEN SUM(coalesce(URS.TotalRatings,0)) > 0 THEN SUM(coalesce(URS.ratingAvg,0)*coalesce(URS.TotalRatings,0))/SUM(coalesce(URS.TotalRatings,0)) ELSE NULL END as averageRating
                        ,SUM(coalesce(URS.TotalRatings,0)) as totalRatings
                        ,AVG(US.ResponseTimeMinutes) as averageResponseTimeMinutes
                        ,AVG(PHR.averageHourlyRate) As averageHourlyRate
                        ,CASE WHEN MIN(MSP.minServicePrice) > 0 THEN MIN(MSP.minServicePrice) ELSE NULL END as minServicePrice
                        ,MIN(PHR.minHourlyRate) As minHourlyRate
                        ,CASE WHEN (MIN(PHR.minHourlyRate) > 0 AND MIN(MSP.minServicePrice) > 0) AND MIN(MSP.minServicePrice) < MIN(PHR.minHourlyRate) THEN '$' + convert(varchar,  MIN(MSP.minServicePrice))
                          WHEN (MIN(PHR.minHourlyRate) > 0 AND MIN(MSP.minServicePrice) > 0) AND MIN(PHR.minHourlyRate) < MIN(MSP.minServicePrice) THEN '$' + convert(varchar,  MIN(PHR.minHourlyRate)) + '/hour'
                          WHEN (MIN(MSP.minServicePrice) > 0 AND MIN(PHR.minHourlyRate) is null) THEN '$' + convert(varchar,  MIN(MSP.minServicePrice))
                          WHEN (MIN(PHR.minHourlyRate) > 0 AND MIN(MSP.minServicePrice) <= 0) THEN '$' + convert(varchar,  MIN(PHR.minHourlyRate)) + '/hour' ELSE NULL END as minServiceValue
                        ,COUNT(distinct SPC.userID) as serviceProfessionalsCount
                        ,P.displayRank
                    FROM    
                        Positions As P
                        LEFT JOIN
                            UserProfilePositions As UP
                        ON 
                            UP.PositionID = P.PositionID
                            AND UP.LanguageID = P.LanguageID
                            AND UP.CountryID = P.CountryID
                            AND UP.Active = 1
                            AND UP.StatusID = 1
                        LEFT JOIN
                            (SELECT 
                            up.UserID
                            ,up.PositionID
                            ,MIN(ROUND(@orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000,1)) as distance
                            FROM address a
                            INNER JOIN
                            serviceaddress sa
                            ON a.addressID=sa.addressID
                            INNER JOIN UserProfilePositions up
                            ON sa.userID = up.UserID
                            AND sa.PositionID = up.PositionID
                            WHERE 
                            a.Latitude IS NOT NULL
                            AND a.Longitude IS NOT NULL
                            AND @orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000*0.621371 <=
                            (CASE WHEN (ServicesPerformedAtLocation = 0 AND sa.ServiceRadiusFromLocation IS NOT NULL) THEN
                            CONVERT(FLOAT, ServiceRadiusFromLocation)
                            ELSE 
                            @searchDistance
                            END)
                            AND up.StatusID=1
                            AND up.Active=1
                            GROUP BY up.PositionID, up.UserID) As SPC
                        ON
                            UP.PositionID = SPC.PositionID
                            AND UP.UserID = SPC.UserID              
                        LEFT JOIN
                            (SELECT 
                            UserID
                            ,PositionID
                            ,TotalRatings
                            ,sum(coalesce(Rating1, 0) + coalesce(Rating2, 0) + coalesce(Rating3, 0))/3 as ratingAvg
                            FROM UserReviewScores
                            GROUP BY UserID, PositionID, TotalRatings) As URS
                        ON 
                            SPC.UserID = URS.UserID
                            AND SPC.PositionID = URS.PositionID             
                        LEFT JOIN
                            (SELECT 
                            UserID
                            ,ResponseTimeMinutes
                            FROM UserStats
                            ) As US
                        ON 
                            SPC.UserID = US.UserID     
                        LEFT JOIN
                            (SELECT 
                            ProviderUserID
                            ,PositionID
                            ,min(ProviderPackagePrice) as minServicePrice
                            ,count(*) as servicesCount
                            FROM
                            ProviderPackage
                            WHERE 
                            ProviderPackage.Active = 1 
                            AND ProviderPackage.PricingTypeID != 7
                            GROUP BY ProviderUserID, PositionID) MSP
                            ON 
                            SPC.UserID = MSP.ProviderUserID
                            AND SPC.PositionID = MSP.PositionID     
                        LEFT JOIN
                           (SELECT	
                                ProviderPackage.ProviderUserID
                                ,ProviderPackage.PositionID
                                ,CASE WHEN min(ProviderPackagePrice) > 0 THEN min(ProviderPackagePrice) else NULL end as minServicePrice
                                ,CASE WHEN min(PriceRate) > 0 THEN min(PriceRate) else NULL end as minHourlyRate
                                ,AVG(PriceRate) as averageHourlyRate
                            FROM	
                                ProviderPackage
                            WHERE	
                                ProviderPackage.Active = 1
                                AND ProviderPackage.PriceRateUnit like '%HOUR%' 
                                AND ProviderPackage.PricingTypeID != 7
                            GROUP BY	
                                ProviderPackage.ProviderUserID, ProviderPackage.PositionID) As PHR
                         ON 
                            MSP.ProviderUserID = PHR.ProviderUserID
                            AND MSP.PositionID = PHR.PositionID
                    WHERE
                        P.PositionID = @jobTitleID
                        AND P.Active = 1
                        AND P.LanguageID = @languageID
                        AND P.CountryID = @countryID
                        AND p.Approved = 1 
                        AND dbo.fx_IfNW(p.PositionSingular, null) is not null    
                    GROUP BY P.PositionID, P.PositionSingular, P.PositionPlural, P.PositionDescription, P.PositionSearchDescription, P.DisplayRank

                    ORDER BY count(distinct spc.userID) DESC, P.DisplayRank
                                ", jobTitleID, origLat, origLong, SearchDistance, locale.languageID, locale.countryID));
            }
        }
        public static IEnumerable<JobTitleSearchResult> SearchByCategoryID(int categoryID, decimal origLat, decimal origLong, int SearchDistance, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(@"
                    DECLARE @categoryID AS int
                    SET @categoryID = @0
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
                        P.PositionID as jobTitleID
                        ,P.PositionSingular as singularName
                        ,P.PositionPlural as pluralName
                        ,P.PositionDescription as description
                        ,P.PositionSearchDescription as searchDescription
                        ,CASE WHEN SUM(coalesce(URS.TotalRatings,0)) > 0 THEN SUM(coalesce(URS.ratingAvg,0)*coalesce(URS.TotalRatings,0))/SUM(coalesce(URS.TotalRatings,0)) ELSE NULL END as averageRating
                        ,SUM(coalesce(URS.TotalRatings,0)) as totalRatings
                        ,AVG(US.ResponseTimeMinutes) as averageResponseTimeMinutes
                        ,AVG(PHR.averageHourlyRate) As averageHourlyRate
                        ,CASE WHEN MIN(MSP.minServicePrice) > 0 THEN MIN(MSP.minServicePrice) ELSE NULL END as minServicePrice
                        ,MIN(PHR.minHourlyRate) As minHourlyRate
                        ,CASE WHEN (MIN(PHR.minHourlyRate) > 0 AND MIN(MSP.minServicePrice) > 0) AND MIN(MSP.minServicePrice) < MIN(PHR.minHourlyRate) THEN '$' + convert(varchar,  MIN(MSP.minServicePrice))
                          WHEN (MIN(PHR.minHourlyRate) > 0 AND MIN(MSP.minServicePrice) > 0) AND MIN(PHR.minHourlyRate) < MIN(MSP.minServicePrice) THEN '$' + convert(varchar,  MIN(PHR.minHourlyRate)) + '/hour'
                          WHEN (MIN(MSP.minServicePrice) > 0 AND MIN(PHR.minHourlyRate) is null) THEN '$' + convert(varchar,  MIN(MSP.minServicePrice))
                          WHEN (MIN(PHR.minHourlyRate) > 0 AND MIN(MSP.minServicePrice) <= 0) THEN '$' + convert(varchar,  MIN(PHR.minHourlyRate)) + '/hour' ELSE NULL END as minServiceValue
                        ,COUNT(distinct SPC.userID) as serviceProfessionalsCount
                        ,P.displayRank
                    FROM    
                        Positions As P
                        LEFT JOIN
                            ServiceCategoryPosition As SCP
                        ON 
                            P.PositionID = SCP.PositionID
                            AND P.LanguageID = SCP.LanguageID
                            AND P.CountryID = SCP.CountryID
                        LEFT JOIN
                            UserProfilePositions As UP
                        ON 
                            UP.PositionID = P.PositionID
                            AND UP.LanguageID = P.LanguageID
                            AND UP.CountryID = P.CountryID
                            AND UP.Active = 1
                            AND UP.StatusID = 1
                        LEFT JOIN
                            (SELECT 
                            up.UserID
                            ,up.PositionID
                            ,MIN(ROUND(@orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000,1)) as distance
                            FROM address a
                            INNER JOIN
                            serviceaddress sa
                            ON a.addressID=sa.addressID
                            INNER JOIN UserProfilePositions up
                            ON sa.userID = up.UserID
                            AND sa.PositionID = up.PositionID
                            WHERE 
                            a.Latitude IS NOT NULL
                            AND a.Longitude IS NOT NULL
                            AND @orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000 <=
                            (CASE WHEN (ServicesPerformedAtLocation = 0 AND sa.ServiceRadiusFromLocation IS NOT NULL) THEN
                            CONVERT(FLOAT, ServiceRadiusFromLocation)
                            ELSE 
                            @searchDistance
                            END)
                            AND up.StatusID=1
                            AND up.Active=1
                            GROUP BY up.PositionID, up.UserID) As SPC
                        ON
                            UP.PositionID = SPC.PositionID
                            AND UP.UserID = SPC.UserID              
                        LEFT JOIN
                            (SELECT 
                            UserID
                            ,PositionID
                            ,TotalRatings
                            ,sum(coalesce(Rating1, 0) + coalesce(Rating2, 0) + coalesce(Rating3, 0))/3 as ratingAvg
                            FROM UserReviewScores
                            GROUP BY UserID, PositionID, TotalRatings) As URS
                        ON 
                            SPC.UserID = URS.UserID
                            AND SPC.PositionID = URS.PositionID             
                        LEFT JOIN
                            (SELECT 
                            UserID
                            ,ResponseTimeMinutes
                            FROM UserStats
                            ) As US
                        ON 
                            SPC.UserID = US.UserID     
                        LEFT JOIN
                            (SELECT 
                            ProviderUserID
                            ,PositionID
                            ,min(ProviderPackagePrice) as minServicePrice
                            ,count(*) as servicesCount
                            FROM
                            ProviderPackage
                            WHERE 
                            ProviderPackage.Active = 1 
                            AND ProviderPackage.PricingTypeID != 7
                            GROUP BY ProviderUserID, PositionID) MSP
                            ON 
                            SPC.UserID = MSP.ProviderUserID
                            AND SPC.PositionID = MSP.PositionID     
                        LEFT JOIN
                           (SELECT	
                                ProviderPackage.ProviderUserID
                                ,ProviderPackage.PositionID
                                ,CASE WHEN min(ProviderPackagePrice) > 0 THEN min(ProviderPackagePrice) else NULL end as minServicePrice
                                ,CASE WHEN min(PriceRate) > 0 THEN min(PriceRate) else NULL end as minHourlyRate
                                ,AVG(PriceRate) as averageHourlyRate
                            FROM	
                                ProviderPackage
                            WHERE	
                                ProviderPackage.Active = 1
                                AND ProviderPackage.PriceRateUnit like '%HOUR%' 
                                AND ProviderPackage.PricingTypeID != 7
                            GROUP BY	
                                ProviderPackage.ProviderUserID, ProviderPackage.PositionID) As PHR
                         ON 
                            MSP.ProviderUserID = PHR.ProviderUserID
                            AND MSP.PositionID = PHR.PositionID
                    WHERE
                        SCP.ServiceCategoryID = @categoryID
                        AND SCP.Active = 1
                        AND P.Active = 1
                        AND P.LanguageID = @languageID
                        AND P.CountryID = @countryID
                        AND p.Approved = 1 
                        AND dbo.fx_IfNW(p.PositionSingular, null) is not null    
                    GROUP BY P.PositionID, P.PositionSingular, P.PositionPlural, P.PositionDescription, P.PositionSearchDescription, P.DisplayRank
                    ORDER BY count(distinct spc.userID) DESC, P.displayRank, P.PositionPlural
                                ", categoryID, origLat, origLong, SearchDistance, locale.languageID, locale.countryID)
                    .Select(FromDB);
            }
        }
/* TODO Create ServiceSubCategoryPosition table in db and map positions and double-check query
        
        public static IEnumerable<JobTitleSearchResult> SearchBySubCategoryID(int ServiceSubCategoryID, decimal origLat, decimal origLong, int SearchDistance, Locale locale)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(@"
                    DECLARE @ServiceSubCategoryID AS int
                    SET @ServiceSubCategoryID = @0
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
                            P.PositionID as jobTitleID
                            ,P.PositionPlural as pluralName
                            ,P.PositionSingular as singularName
                            ,P.PositionDescription as description
                            ,P.PositionSearchDescription as searchDescription
                            ,coalesce((SELECT
                                avg( (coalesce(UR2.Rating1, 0) + coalesce(UR2.Rating2, 0) + coalesce(UR2.Rating3, 0)) / 3) As AVR
                              FROM UserReviews As UR2
                                INNER JOIN
                                  UserProfilePositions As UP2
                                  ON UP2.PositionID = UR2.PositionID
                                    AND UR2.ProviderUserID = UP2.UserID
                                    AND UP2.LanguageID = @LanguageID
                                    AND UP2.CountryID = @CountryID
                                    AND UP2.Active = 1
                                    AND UP2.StatusID = 1
                              WHERE UR2.PositionID = P.PositionID
                            ), 0) As averageRating
                            ,coalesce(sum(ur.TotalRatings), 0) As totalRatings
                            ,avg(US.ResponseTimeMinutes) As averageResponseTimeMinutes
                            ,avg(PHR.HourlyRate) As averageHourlyRate
                            ,count (distinct SPC.UserID) As serviceProfessionalsCount

                    FROM	Positions As P
                             INNER JOIN
                            ServiceSubCategoryPosition As SSCP
                              ON P.PositionID = SSCP.PositionID
                                AND P.LanguageID = SSCP.LanguageID
                                AND P.CountryID = SSCP.CountryID
                             INNER JOIN
                            ServiceSubCategory As SSC
                              ON SSCP.ServiceCategoryID = SSC.ServiceCategoryID
                                AND SSCP.LanguageID = SSC.LanguageID
                                AND SSCP.CountryID = SSC.CountryID
                             LEFT JOIN
                            UserProfilePositions As UP
                              ON UP.PositionID = P.PositionID
                                AND UP.LanguageID = P.LanguageID
                                AND UP.CountryID = P.CountryID
                                AND UP.Active = 1
                                AND UP.StatusID = 1
                             LEFT JOIN
                                (SELECT up.PositionID, up.UserID
                                    FROM address a
                                    INNER JOIN
                                    serviceaddress sa
                                    ON a.addressID=sa.addressID
                                    INNER JOIN UserProfilePositions up
                                    ON sa.userID = up.UserID
                                    AND sa.PositionID = up.PositionID
                                    WHERE 
                                    a.Latitude IS NOT NULL
                                    AND a.Longitude IS NOT NULL
                                    AND @orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000*0.621371 <=
                                    (CASE WHEN (ServicesPerformedAtLocation = 0 AND sa.ServiceRadiusFromLocation IS NOT NULL) THEN
                                    CONVERT(FLOAT, ServiceRadiusFromLocation)
                                    ELSE 
                                    @SearchDistance
                                    END)
                                    AND up.StatusID=1
                                    AND up.Active=1
                                ) As SPC
                                    ON
                                    UP.PositionID = SPC.PositionID
                             LEFT JOIN
                            UserReviewScores AS UR
                              ON UR.UserID = UP.UserID
                                AND UR.PositionID = UP.PositionID
                             LEFT JOIN
                            UserStats As US
                              ON US.UserID = UP.UserID
                             LEFT JOIN
                            (SELECT	ProviderPackage.ProviderUserID As UserID
                                    ,ProviderPackage.PositionID
                                    ,min(PriceRate) As HourlyRate
                                    ,LanguageID
                                    ,CountryID
                             FROM	ProviderPackage
                             WHERE	ProviderPackage.Active = 1
                                    AND ProviderPackage.PriceRateUnit like 'HOUR' 
                                    AND ProviderPackage.PriceRate > 0
                             GROUP BY	ProviderPackage.ProviderUserID, ProviderPackage.PositionID
                                        ,LanguageID, CountryID
                            ) As PHR
                              ON PHR.UserID = UP.UserID
                                AND PHR.PositionID = UP.PositionID
                                AND PHR.LanguageID = P.LanguageID
                                AND PHR.CountryID = P.CountryID
                    WHERE
                            SSC.ServiceSubCategoryID = @ServiceSubCategoryID
                             AND
                            SSCP.Active = 1
                             AND
                            P.Active = 1
                             AND
                            P.LanguageID = @LanguageID
                             AND
                            P.CountryID = @CountryID
                            AND (p.Approved = 1 Or p.Approved is null) 
							AND dbo.fx_IfNW(p.PositionSingular, null) is not null           
                    GROUP BY P.PositionID, P.PositionPlural, P.PositionSingular, P.PositionDescription, P.PositionSearchDescription, P.DisplayRank
                    ORDER BY serviceProfessionalsCount DESC, P.DisplayRank, P.PositionPlural  
                                ", ServiceSubCategoryID, origLat, origLong, SearchDistance, locale.languageID, locale.countryID)
                    .Select(FromDB);
            }
        }*/
        public static IEnumerable<JobTitleSearchResult> SearchBySearchTerm(string SearchTerm, decimal origLat, decimal origLong, int SearchDistance, Locale locale)
        {
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
                        P.PositionID as jobTitleID
                        ,P.PositionSingular as singularName
                        ,P.PositionPlural as pluralName
                        ,P.PositionDescription as description
                        ,P.PositionSearchDescription as searchDescription
                        ,CASE WHEN SUM(coalesce(URS.TotalRatings,0)) > 0 THEN SUM(coalesce(URS.ratingAvg,0)*coalesce(URS.TotalRatings,0))/SUM(coalesce(URS.TotalRatings,0)) ELSE NULL END as averageRating
                        ,SUM(coalesce(URS.TotalRatings,0)) as totalRatings
                        ,AVG(US.ResponseTimeMinutes) as averageResponseTimeMinutes
                        ,AVG(PHR.averageHourlyRate) As averageHourlyRate
                        ,CASE WHEN MIN(MSP.minServicePrice) > 0 THEN MIN(MSP.minServicePrice) ELSE NULL END as minServicePrice
                        ,MIN(PHR.minHourlyRate) As minHourlyRate
                        ,CASE WHEN (MIN(PHR.minHourlyRate) > 0 AND MIN(MSP.minServicePrice) > 0) AND MIN(MSP.minServicePrice) < MIN(PHR.minHourlyRate) THEN '$' + convert(varchar,  MIN(MSP.minServicePrice))
                          WHEN (MIN(PHR.minHourlyRate) > 0 AND MIN(MSP.minServicePrice) > 0) AND MIN(PHR.minHourlyRate) < MIN(MSP.minServicePrice) THEN '$' + convert(varchar,  MIN(PHR.minHourlyRate)) + '/hour'
                          WHEN (MIN(MSP.minServicePrice) > 0 AND MIN(PHR.minHourlyRate) is null) THEN '$' + convert(varchar,  MIN(MSP.minServicePrice))
                          WHEN (MIN(PHR.minHourlyRate) > 0 AND MIN(MSP.minServicePrice) <= 0) THEN '$' + convert(varchar,  MIN(PHR.minHourlyRate)) + '/hour' ELSE NULL END as minServiceValue
                        ,COUNT(distinct SPC.userID) as serviceProfessionalsCount
                        ,P.displayRank
                    FROM    
                        Positions As P
                        LEFT JOIN
                            ServiceCategoryPosition As SCP
                        ON 
                            P.PositionID = SCP.PositionID
                            AND P.LanguageID = SCP.LanguageID
                            AND P.CountryID = SCP.CountryID
                        LEFT JOIN
                            UserProfilePositions As UP
                        ON 
                            UP.PositionID = P.PositionID
                            AND UP.LanguageID = P.LanguageID
                            AND UP.CountryID = P.CountryID
                            AND UP.Active = 1
                            AND UP.StatusID = 1
                        LEFT JOIN
                            (SELECT 
                            up.UserID
                            ,up.PositionID
                            ,MIN(ROUND(@orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000,1)) as distance
                            FROM address a
                            INNER JOIN
                            serviceaddress sa
                            ON a.addressID=sa.addressID
                            INNER JOIN UserProfilePositions up
                            ON sa.userID = up.UserID
                            AND sa.PositionID = up.PositionID
                            WHERE 
                            a.Latitude IS NOT NULL
                            AND a.Longitude IS NOT NULL
                            AND @orig.STDistance(geography::Point(a.Latitude, a.Longitude, 4326))/1000 <=
                            (CASE WHEN (ServicesPerformedAtLocation = 0 AND sa.ServiceRadiusFromLocation IS NOT NULL) THEN
                            CONVERT(FLOAT, ServiceRadiusFromLocation)
                            ELSE 
                            @searchDistance
                            END)
                            AND up.StatusID=1
                            AND up.Active=1
                            GROUP BY up.PositionID, up.UserID) As SPC
                        ON
                            UP.PositionID = SPC.PositionID
                            AND UP.UserID = SPC.UserID              
                        LEFT JOIN
                            (SELECT 
                            UserID
                            ,PositionID
                            ,TotalRatings
                            ,sum(coalesce(Rating1, 0) + coalesce(Rating2, 0) + coalesce(Rating3, 0))/3 as ratingAvg
                            FROM UserReviewScores
                            GROUP BY UserID, PositionID, TotalRatings) As URS
                        ON 
                            SPC.UserID = URS.UserID
                            AND SPC.PositionID = URS.PositionID             
                        LEFT JOIN
                            (SELECT 
                            UserID
                            ,ResponseTimeMinutes
                            FROM UserStats
                            ) As US
                        ON 
                            SPC.UserID = US.UserID     
                        LEFT JOIN
                            (SELECT 
                            ProviderUserID
                            ,PositionID
                            ,min(ProviderPackagePrice) as minServicePrice
                            ,count(*) as servicesCount
                            FROM
                            ProviderPackage
                            WHERE 
                            ProviderPackage.Active = 1 
                            AND ProviderPackage.PricingTypeID != 7
                            GROUP BY ProviderUserID, PositionID) MSP
                            ON 
                            SPC.UserID = MSP.ProviderUserID
                            AND SPC.PositionID = MSP.PositionID     
                        LEFT JOIN
                           (SELECT	
                                ProviderPackage.ProviderUserID
                                ,ProviderPackage.PositionID
                                ,CASE WHEN min(ProviderPackagePrice) > 0 THEN min(ProviderPackagePrice) else NULL end as minServicePrice
                                ,CASE WHEN min(PriceRate) > 0 THEN min(PriceRate) else NULL end as minHourlyRate
                                ,AVG(PriceRate) as averageHourlyRate
                            FROM	
                                ProviderPackage
                            WHERE	
                                ProviderPackage.Active = 1
                                AND ProviderPackage.PriceRateUnit like '%HOUR%' 
                                AND ProviderPackage.PricingTypeID != 7
                            GROUP BY	
                                ProviderPackage.ProviderUserID, ProviderPackage.PositionID) As PHR
                         ON 
                            MSP.ProviderUserID = PHR.ProviderUserID
                            AND MSP.PositionID = PHR.PositionID
                    WHERE
                        SCP.Active = 1
                        AND P.Active = 1
                        AND P.LanguageID = @languageID
                        AND P.CountryID = @countryID
                        AND p.Approved = 1 
                        AND dbo.fx_IfNW(p.PositionSingular, null) is not null    
                        AND (p.PositionSingular like @SearchTerm
                            OR
                            p.PositionPlural like @SearchTerm
                            OR
                            p.PositionDescription like @SearchTerm
                            OR
                            p.Aliases like @SearchTerm
                            OR
                            p.GovPosition like @SearchTerm
                            OR
                            p.GovPositionDescription like @SearchTerm
                            OR
                            EXISTS (SELECT *
                                    FROM	UserProfileServiceAttributes As SP
                                     INNER JOIN
                                    ServiceAttribute As SA
                                      ON SP.ServiceAttributeID = SA.ServiceAttributeID
                                        AND SP.Active = 1
                                        AND SA.Active = 1
                                        AND SA.LanguageID = SP.LanguageID
                                        AND SA.CountryID = SP.CountryID
                                    WHERE
                                    SP.PositionID = p.PositionID
                                    AND SA.LanguageID = @LanguageID
                                    AND SA.CountryID = @CountryID
                                    AND (
                                     SA.Name like @SearchTerm
                                      OR
                                     SA.ServiceAttributeDescription like @SearchTerm
                                    )
                                )
                        )
                    GROUP BY P.PositionID, P.PositionPlural, P.PositionSingular, P.PositionDescription, P.PositionSearchDescription, P.DisplayRank

                    ORDER BY count(distinct spc.userID) DESC, P.displayRank

                                ", "%" + SearchTerm + "%", origLat, origLong, SearchDistance, locale.languageID, locale.countryID)
                    .Select(FromDB);
            }
        }
        #endregion
    }
}