﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Web.Helpers;
using Newtonsoft.Json;

namespace LcRest
{
    /// <summary>
    /// Descripción breve de LcRestPricingSummaryDetail
    /// 
    /// TODO: For hourly and special pricings, implement the *DataInput fields as dynaminc and saving them as JSON encoded strings, managing
    /// the load with another helper class for variables and setting in the details the current
    /// service professional values and client choosen values. See sample SetDataInput method, commented
    /// </summary>
    public class PricingSummaryDetail
    {
        #region Fields
        public int pricingSummaryID = 0;
        public int pricingSummaryRevision = 0;
        public int serviceProfessionalServiceID;
        public string serviceProfessionalDataInput;
        public string clientDataInput;
        public decimal? hourlyPrice;
        public decimal? price;
        public decimal? serviceDurationMinutes;
        public decimal? firstSessionDurationMinutes;
        public string serviceName;
        public string serviceDescription;
        public int numberOfSessions;
        /// <summary>
        /// Copied from the service record, whether is a service provided remotely
        /// (without requiring an address where perform it, like by doing it through phone, video conference, ...)
        /// </summary>
        public bool isRemoteService;
        public DateTime createdDate;
        public DateTime updatedDate;
        #endregion

        /*#region Links
        [JsonIgnoreAttribute]
        public ServiceProfessionalService serviceProfessionalService;
        #endregion*/

        #region Instances
        public PricingSummaryDetail() { }

        public static PricingSummaryDetail FromDB(dynamic record)
        {
            return new PricingSummaryDetail
            {
                pricingSummaryID = record.pricingSummaryID,
                pricingSummaryRevision = record.pricingSummaryRevision,
                serviceProfessionalServiceID = record.serviceProfessionalServiceID,
                serviceProfessionalDataInput = record.serviceProfessionalDataInput,
                clientDataInput = record.clientDataInput,
                hourlyPrice = record.hourlyPrice,
                price = record.price,
                serviceDurationMinutes = record.serviceDurationMinutes,
                firstSessionDurationMinutes = record.firstSessionDurationMinutes,
                serviceName = record.serviceName,
                serviceDescription = record.serviceDescription,
                numberOfSessions = record.numberOfSessions,
                isRemoteService = record.isRemoteService,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate
            };
        }

        /// <summary>
        /// Create a pricing summary detail for a given service professional service, copying
        /// the needed data and performing the calculations that apply to that service/pricing-type
        /// to fill the detail fields.
        /// 
        /// TODO: Adapt and add special pricing calculations, with variables, hourlyPrice*serviceDurationMinutes/60 and hourlySurcharge,
        /// needed for Housekeepr and Babysitter/hourly-pricings. There was previous code at LcPricingModel, needs some refactor for the new way
        /// common interfaces for LcRest classes, calculations and save data. Some comments added to guide the process.
        /// </summary>
        /// <param name="service"></param>
        /// <returns></returns>
        public static PricingSummaryDetail FromServiceProfessionalService(ServiceProfessionalService service)
        {
            var allSessionsMinutes = service.numberOfSessions > 0 ? service.serviceDurationMinutes * service.numberOfSessions : service.serviceDurationMinutes;

            // Complex calculations based on pricing type
            //var config = LcPricingModel.PackageBasePricingTypeConfigs[service.pricingTypeID];
            //config.PriceCalculation == LcEnum.PriceCalculationType.FixedPrice/HourlyPrice
            // Calculate time and price required for selected package
            /*if (config.Mod != null)
            {
                // Applying calculation from the PackageMod
                // TODO: needs refactor, on interface and implementations because: there is no more 'fees' and subtotals per detail, that's done in the summary only.
                config.Mod.CalculateCustomerData(customerID, thePackage, fee, modelData, ModelState);
            }
            if (config.PriceCalculation == LcEnum.PriceCalculationType.HourlyPrice)
            {
                // Discard value of priceRateUnit, is forced to be HOUR for this pricing-type
                hourlyPrice = service.priceRate ?? 0
            }
            */

            return new PricingSummaryDetail
            {
                serviceDurationMinutes = allSessionsMinutes,
                firstSessionDurationMinutes = service.serviceDurationMinutes,
                price = service.price,
                serviceProfessionalServiceID = service.serviceProfessionalServiceID,
                serviceName = service.name,
                serviceDescription = service.description,
                numberOfSessions = service.numberOfSessions,
                hourlyPrice = !String.IsNullOrEmpty(service.priceRateUnit) && service.priceRateUnit.ToUpper() == "HOUR" ? service.priceRate : null,
                isRemoteService = service.isPhone
            };
        }
        #endregion

        #region Fetch
        const string sqlGetItem = @"
            SELECT
                pricingSummaryID,
                pricingSummaryRevision,
                serviceProfessionalServiceID,
                serviceProfessionalDataInput,
                clientDataInput,
                hourlyPrice,
                price,
                serviceDurationMinutes,
                firstSessionDurationMinutes,
                serviceName,
                serviceDescription,
                numberOfSessions,
                isRemoteService,
                createdDate,
                updatedDate
            FROM
                PricingSummaryDetail
            WHERE
                PricingSummaryID = @0
                AND PricingSummaryRevision = @1
        ";
        public static IEnumerable<PricingSummaryDetail> GetList(int id, int revision)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(sqlGetItem, id, revision).Select(FromDB);
            }
        }
        #endregion

        #region Set
        #region SQL
        const string sqlInsertItem = @"
            INSERT INTO PricingSummaryDetail (
                pricingSummaryID,
                pricingSummaryRevision,
                serviceProfessionalServiceID,
                serviceProfessionalDataInput,
                clientDataInput,
                hourlyPrice,
                price,
                serviceDurationMinutes,
                firstSessionDurationMinutes,
                serviceName,
                serviceDescription,
                numberOfSessions,
                isRemoteService,
                createdDate,
                updatedDate,
                modifiedBy
            ) VALUES (
                @0, -- ID
                @1, -- revision
                @2, -- serviceID
                @3, -- prof input
                @4, -- client iput
                @5, -- hourly
                @6, -- subtotal
                @7, -- duration
                @8, -- first duration
                @9, -- service name
                @10, -- service description
                @11, -- number of sessions
                @12, -- remote service
                getdate(), getdate(), 'sys'
            )

            SELECT * FROM PricingSummaryDetail
            WHERE pricingSummaryID = @0 AND pricingSummaryRevision = @1 AND serviceProfessionalServiceID = @2
        ";
        #endregion

        /// <summary>
        /// Save the given pricing summary detail and returns a copy of the record from database after
        /// that (so it includes andy generated values)
        /// </summary>
        /// <param name="data"></param>
        public static PricingSummaryDetail Set(PricingSummaryDetail data, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                return FromDB(db.QuerySingle(sqlInsertItem,
                    data.pricingSummaryID, data.pricingSummaryRevision,
                    data.serviceProfessionalServiceID,
                    data.serviceProfessionalDataInput,
                    data.clientDataInput,
                    data.hourlyPrice,
                    data.price,
                    data.serviceDurationMinutes, data.firstSessionDurationMinutes,
                    data.serviceName, data.serviceDescription,
                    data.numberOfSessions,
                    data.isRemoteService
                    ));
            }
            // TODO PricingMod/PricingVariables -> part of code ate SetDataInput, complete and call here?
        }

        /*
        public void SetDataInput(dynamic serviceProfessionalData, dynamic clientData)
        {
            string profInput = Json.Encode(serviceProfessionalData ?? "");
            string clientInput = "";

            // Supporting PricingVariables
            if (clientData is LcPricingModel.PricingVariables)
            {
                clientInput = clientData.ToString();
                // TODO Save????? What does, must be on Set or here?
                ((LcPricingModel.PricingVariables)clientData).Save(estimateID, revisionID, WebMatrix.WebData.WebSecurity.CurrentUserId);
            }
            else
            {
                clientInput = Json.Encode(clientData ?? "");
            }

            clientDataInput = clientInput;
            serviceProfessionalDataInput = serviceProfessionalData;
        }*/
        #endregion

        #region Query
        /// <summary>
        /// Get the pricing name and detailed information to describe it in one line of plain-text.
        /// It shows the inperson-phone text if need, number of appointments,
        /// duration and pricing-mod extra-details following its pricing-config
        /// in a standard format for this pricing type.
        /// </summary>
        /// <param name="service"></param>
        /// <param name="pricing"></param>
        /// <returns></returns>
        internal static string GetOneLineDescription(LcRest.ServiceProfessionalService service, LcRest.PricingSummaryDetail pricing)
        {
            var f = "";
            var inpersonphone = "";

            var pricingConfig = LcPricingModel.PackageBasePricingTypeConfigs[service.pricingTypeID];
            if (pricing.numberOfSessions > 1)
            {
                if (pricing.firstSessionDurationMinutes == 0)
                    f = pricingConfig.NameAndSummaryFormatMultipleSessionsNoDuration;
                else
                    f = pricingConfig.NameAndSummaryFormatMultipleSessions;
            }
            else if (pricing.firstSessionDurationMinutes == 0)
                f = pricingConfig.NameAndSummaryFormatNoDuration;
            if (String.IsNullOrEmpty(f))
                f = pricingConfig.NameAndSummaryFormat;

            // TODO: i18n
            if (pricingConfig.InPersonPhoneLabel != null)
                inpersonphone = service.isPhone
                    ? "phone"
                    : "in-person";

            var extraDetails = "";
            // Extra information for special pricings:
            if (pricingConfig.Mod != null && pricing.pricingSummaryID > 0)
            {
                // TODO PackageMod class will need refactor/renamings
                extraDetails = pricingConfig.Mod.GetPackagePricingDetails(service.serviceProfessionalServiceID, pricing.pricingSummaryID, pricing.pricingSummaryRevision);
            }

            // Show duration in a smart way.
            var duration = ASP.LcHelpers.TimeToSmartLongString(TimeSpan.FromMinutes((double)pricing.firstSessionDurationMinutes));

            var result = String.Format(f, pricing.serviceName, duration, pricing.numberOfSessions, inpersonphone);
            if (!String.IsNullOrEmpty(extraDetails))
            {
                result += String.Format(" ({0})", extraDetails);
            }
            return result;
        }
        #endregion
    }
}