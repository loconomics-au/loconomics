namespace WebMigrations.Models
{
    using System;
    using System.Data.Entity;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Linq;

    public partial class LoconomicsContext : DbContext
    {
        public LoconomicsContext()
            : base("name=LoconomicsContext")
        {
        }

        public virtual DbSet<accountstatus> accountstatus { get; set; }
        public virtual DbSet<address> addresses { get; set; }
        public virtual DbSet<addresstype> addresstypes { get; set; }
        public virtual DbSet<alert> alerts { get; set; }
        public virtual DbSet<alerttype> alerttypes { get; set; }
        public virtual DbSet<backgroundcheck> backgroundchecks { get; set; }
        public virtual DbSet<booking> bookings { get; set; }
        public virtual DbSet<bookingStatus> bookingStatus { get; set; }
        public virtual DbSet<bookingType> bookingTypes { get; set; }
        public virtual DbSet<CalendarAvailabilityType> CalendarAvailabilityTypes { get; set; }
        public virtual DbSet<CalendarEventComment> CalendarEventComments { get; set; }
        public virtual DbSet<CalendarEventExceptionsPeriod> CalendarEventExceptionsPeriods { get; set; }
        public virtual DbSet<CalendarEventExceptionsPeriodsList> CalendarEventExceptionsPeriodsLists { get; set; }
        public virtual DbSet<CalendarEventRecurrencesPeriod> CalendarEventRecurrencesPeriods { get; set; }
        public virtual DbSet<CalendarEventRecurrencesPeriodList> CalendarEventRecurrencesPeriodLists { get; set; }
        public virtual DbSet<CalendarEvent> CalendarEvents { get; set; }
        public virtual DbSet<CalendarEventsAttendee> CalendarEventsAttendees { get; set; }
        public virtual DbSet<CalendarEventsContact> CalendarEventsContacts { get; set; }
        public virtual DbSet<CalendarEventType> CalendarEventTypes { get; set; }
        public virtual DbSet<CalendarProviderAttribute> CalendarProviderAttributes { get; set; }
        public virtual DbSet<CalendarReccurrence> CalendarReccurrences { get; set; }
        public virtual DbSet<CalendarReccurrenceFrequency> CalendarReccurrenceFrequencies { get; set; }
        public virtual DbSet<CalendarRecurrenceFrequencyType> CalendarRecurrenceFrequencyTypes { get; set; }
        public virtual DbSet<cancellationpolicy> cancellationpolicies { get; set; }
        public virtual DbSet<clienttype> clienttypes { get; set; }
        public virtual DbSet<country> countries { get; set; }
        public virtual DbSet<county> counties { get; set; }
        public virtual DbSet<ExperienceLevel> ExperienceLevels { get; set; }
        public virtual DbSet<Gender> Genders { get; set; }
        public virtual DbSet<institution> institutions { get; set; }
        public virtual DbSet<jobTitleLicense> jobTitleLicenses { get; set; }
        public virtual DbSet<language> languages { get; set; }
        public virtual DbSet<languagelevel> languagelevels { get; set; }
        public virtual DbSet<licensecertification> licensecertifications { get; set; }
        public virtual DbSet<Message> Messages { get; set; }
        public virtual DbSet<messagethreadstatus> messagethreadstatus { get; set; }
        public virtual DbSet<messagetype> messagetypes { get; set; }
        public virtual DbSet<MessagingThread> MessagingThreads { get; set; }
        public virtual DbSet<municipality> municipalities { get; set; }
        public virtual DbSet<OwnerAcknowledgment> OwnerAcknowledgments { get; set; }
        public virtual DbSet<OwnerStatus> OwnerStatus { get; set; }
        public virtual DbSet<OwnerStatusHistory> OwnerStatusHistories { get; set; }
        public virtual DbSet<positionbackgroundcheck> positionbackgroundchecks { get; set; }
        public virtual DbSet<positionpricingtype> positionpricingtypes { get; set; }
        public virtual DbSet<positionrating> positionratings { get; set; }
        public virtual DbSet<position> positions { get; set; }
        public virtual DbSet<postalcode> postalcodes { get; set; }
        public virtual DbSet<PricingGroup> PricingGroups { get; set; }
        public virtual DbSet<pricingSummary> pricingSummaries { get; set; }
        public virtual DbSet<pricingSummaryDetail> pricingSummaryDetails { get; set; }
        public virtual DbSet<pricingtype> pricingtypes { get; set; }
        public virtual DbSet<PricingVariableDefinition> PricingVariableDefinitions { get; set; }
        public virtual DbSet<PricingVariableValue> PricingVariableValues { get; set; }
        public virtual DbSet<providerpackage> providerpackages { get; set; }
        public virtual DbSet<providerpackagedetail> providerpackagedetails { get; set; }
        public virtual DbSet<ProviderPaymentAccount> ProviderPaymentAccounts { get; set; }
        public virtual DbSet<providerpaymentpreference> providerpaymentpreferences { get; set; }
        public virtual DbSet<providerpaymentpreferencetype> providerpaymentpreferencetypes { get; set; }
        public virtual DbSet<providerservicephoto> providerservicephotoes { get; set; }
        public virtual DbSet<providertaxform> providertaxforms { get; set; }
        public virtual DbSet<ReferralSource> ReferralSources { get; set; }
        public virtual DbSet<serviceaddress> serviceaddresses { get; set; }
        public virtual DbSet<serviceattribute> serviceattributes { get; set; }
        public virtual DbSet<serviceattributecategory> serviceattributecategories { get; set; }
        public virtual DbSet<ServiceAttributeExperienceLevel> ServiceAttributeExperienceLevels { get; set; }
        public virtual DbSet<ServiceAttributeLanguageLevel> ServiceAttributeLanguageLevels { get; set; }
        public virtual DbSet<servicecategory> servicecategories { get; set; }
        public virtual DbSet<servicecategoryposition> servicecategorypositions { get; set; }
        public virtual DbSet<servicecategorypositionattribute> servicecategorypositionattributes { get; set; }
        public virtual DbSet<ServiceProfessionalClient> ServiceProfessionalClients { get; set; }
        public virtual DbSet<servicesubcategory> servicesubcategories { get; set; }
        public virtual DbSet<stateprovince> stateprovinces { get; set; }
        public virtual DbSet<taxentitytype> taxentitytypes { get; set; }
        public virtual DbSet<tintype> tintypes { get; set; }
        public virtual DbSet<transporttype> transporttypes { get; set; }
        public virtual DbSet<UserAlert> UserAlerts { get; set; }
        public virtual DbSet<userbackgroundcheck> userbackgroundchecks { get; set; }
        public virtual DbSet<usereducation> usereducations { get; set; }
        public virtual DbSet<UserFeePayment> UserFeePayments { get; set; }
        public virtual DbSet<UserLicenseCertification> UserLicenseCertifications { get; set; }
        public virtual DbSet<UserPaymentPlan> UserPaymentPlans { get; set; }
        public virtual DbSet<userprofile> userprofiles { get; set; }
        public virtual DbSet<userprofileposition> userprofilepositions { get; set; }
        public virtual DbSet<userprofileserviceattribute> userprofileserviceattributes { get; set; }
        public virtual DbSet<UserReview> UserReviews { get; set; }
        public virtual DbSet<UserReviewScore> UserReviewScores { get; set; }
        public virtual DbSet<user> users { get; set; }
        public virtual DbSet<usersignup> usersignups { get; set; }
        public virtual DbSet<UserStat> UserStats { get; set; }
        public virtual DbSet<userverification> userverifications { get; set; }
        public virtual DbSet<verification> verifications { get; set; }
        public virtual DbSet<verificationcategory> verificationcategories { get; set; }
        public virtual DbSet<verificationstatus> verificationstatus { get; set; }
        public virtual DbSet<VOCElement> VOCElements { get; set; }
        public virtual DbSet<VOCExperienceCategory> VOCExperienceCategories { get; set; }
        public virtual DbSet<VOCFeedback> VOCFeedbacks { get; set; }
        public virtual DbSet<VOCFlag> VOCFlags { get; set; }
        public virtual DbSet<VOCScore> VOCScores { get; set; }
        public virtual DbSet<webpages_Membership> webpages_Membership { get; set; }
        public virtual DbSet<webpages_OAuthMembership> webpages_OAuthMembership { get; set; }
        public virtual DbSet<webpages_Roles> webpages_Roles { get; set; }
        public virtual DbSet<webpages_FacebookCredentials> webpages_FacebookCredentials { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<accountstatus>()
                .HasMany(e => e.userprofilepositions)
                .WithRequired(e => e.accountstatus)
                .HasForeignKey(e => e.StatusID)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<accountstatus>()
                .HasMany(e => e.users)
                .WithRequired(e => e.accountstatus)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<address>()
                .HasMany(e => e.bookings)
                .WithOptional(e => e.address)
                .HasForeignKey(e => e.ServiceAddressID);

            modelBuilder.Entity<backgroundcheck>()
                .Property(e => e.BackGroundCheckPrice)
                .HasPrecision(5, 2);

            modelBuilder.Entity<booking>()
                .Property(e => e.ClientPayment)
                .HasPrecision(25, 2);

            modelBuilder.Entity<booking>()
                .Property(e => e.ServiceProfessionalPaid)
                .HasPrecision(25, 2);

            modelBuilder.Entity<booking>()
                .Property(e => e.ServiceProfessionalPPFeePaid)
                .HasPrecision(25, 2);

            modelBuilder.Entity<booking>()
                .Property(e => e.LoconomicsPaid)
                .HasPrecision(25, 2);

            modelBuilder.Entity<booking>()
                .Property(e => e.LoconomicsPPFeePaid)
                .HasPrecision(25, 2);

            modelBuilder.Entity<booking>()
                .HasMany(e => e.booking1)
                .WithOptional(e => e.booking2)
                .HasForeignKey(e => e.ParentBookingID);

            modelBuilder.Entity<booking>()
                .HasMany(e => e.ServiceProfessionalClients)
                .WithOptional(e => e.booking)
                .HasForeignKey(e => e.CreatedByBookingID);

            modelBuilder.Entity<bookingStatus>()
                .HasMany(e => e.bookings)
                .WithRequired(e => e.bookingStatus)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<bookingType>()
                .Property(e => e.FirstTimeServiceFeeFixed)
                .HasPrecision(5, 2);

            modelBuilder.Entity<bookingType>()
                .Property(e => e.FirstTimeServiceFeePercentage)
                .HasPrecision(5, 2);

            modelBuilder.Entity<bookingType>()
                .Property(e => e.PaymentProcessingFeePercentage)
                .HasPrecision(5, 2);

            modelBuilder.Entity<bookingType>()
                .Property(e => e.PaymentProcessingFeeFixed)
                .HasPrecision(5, 2);

            modelBuilder.Entity<bookingType>()
                .Property(e => e.FirstTimeServiceFeeMaximum)
                .HasPrecision(5, 2);

            modelBuilder.Entity<bookingType>()
                .Property(e => e.FirstTimeServiceFeeMinimum)
                .HasPrecision(5, 2);

            modelBuilder.Entity<bookingType>()
                .HasMany(e => e.bookings)
                .WithRequired(e => e.bookingType)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<CalendarEventExceptionsPeriod>()
                .Property(e => e.DateStart)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEventExceptionsPeriod>()
                .Property(e => e.DateEnd)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEventExceptionsPeriodsList>()
                .HasMany(e => e.CalendarEventExceptionsPeriods)
                .WithRequired(e => e.CalendarEventExceptionsPeriodsList)
                .HasForeignKey(e => e.IdException);

            modelBuilder.Entity<CalendarEventRecurrencesPeriod>()
                .Property(e => e.DateStart)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEventRecurrencesPeriod>()
                .Property(e => e.DateEnd)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEventRecurrencesPeriodList>()
                .HasMany(e => e.CalendarEventRecurrencesPeriods)
                .WithRequired(e => e.CalendarEventRecurrencesPeriodList)
                .HasForeignKey(e => e.IdRecurrence);

            modelBuilder.Entity<CalendarEvent>()
                .Property(e => e.StarTtime)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEvent>()
                .Property(e => e.EndTime)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEvent>()
                .Property(e => e.StampTime)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEvent>()
                .Property(e => e.UpdatedDate)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEvent>()
                .Property(e => e.CreatedDate)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEvent>()
                .Property(e => e.RecurrenceId)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEvent>()
                .Property(e => e.Deleted)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarEvent>()
                .HasMany(e => e.bookings)
                .WithOptional(e => e.CalendarEvent)
                .HasForeignKey(e => e.AlternativeDate1ID);

            modelBuilder.Entity<CalendarEvent>()
                .HasMany(e => e.bookings1)
                .WithOptional(e => e.CalendarEvent1)
                .HasForeignKey(e => e.AlternativeDate2ID);

            modelBuilder.Entity<CalendarEvent>()
                .HasMany(e => e.bookings2)
                .WithOptional(e => e.CalendarEvent2)
                .HasForeignKey(e => e.ServiceDateID);

            modelBuilder.Entity<CalendarEvent>()
                .HasMany(e => e.CalendarEventComments)
                .WithRequired(e => e.CalendarEvent)
                .HasForeignKey(e => e.IdEvent);

            modelBuilder.Entity<CalendarEvent>()
                .HasMany(e => e.CalendarEventExceptionsPeriodsLists)
                .WithRequired(e => e.CalendarEvent)
                .HasForeignKey(e => e.IdEvent);

            modelBuilder.Entity<CalendarEvent>()
                .HasMany(e => e.CalendarEventRecurrencesPeriodLists)
                .WithRequired(e => e.CalendarEvent)
                .HasForeignKey(e => e.IdEvent);

            modelBuilder.Entity<CalendarEvent>()
                .HasMany(e => e.CalendarEventsAttendees)
                .WithRequired(e => e.CalendarEvent)
                .HasForeignKey(e => e.IdEvent);

            modelBuilder.Entity<CalendarEvent>()
                .HasMany(e => e.CalendarEventsContacts)
                .WithRequired(e => e.CalendarEvent)
                .HasForeignKey(e => e.IdEvent);

            modelBuilder.Entity<CalendarEvent>()
                .HasMany(e => e.CalendarReccurrences)
                .WithOptional(e => e.CalendarEvent)
                .HasForeignKey(e => e.EventID)
                .WillCascadeOnDelete();

            modelBuilder.Entity<CalendarEventType>()
                .HasMany(e => e.CalendarEvents)
                .WithRequired(e => e.CalendarEventType)
                .HasForeignKey(e => e.EventType);

            modelBuilder.Entity<CalendarProviderAttribute>()
                .Property(e => e.AdvanceTime)
                .HasPrecision(10, 2);

            modelBuilder.Entity<CalendarProviderAttribute>()
                .Property(e => e.MinTime)
                .HasPrecision(10, 2);

            modelBuilder.Entity<CalendarProviderAttribute>()
                .Property(e => e.MaxTime)
                .HasPrecision(10, 2);

            modelBuilder.Entity<CalendarProviderAttribute>()
                .Property(e => e.BetweenTime)
                .HasPrecision(10, 2);

            modelBuilder.Entity<CalendarReccurrence>()
                .Property(e => e.Until)
                .HasPrecision(0);

            modelBuilder.Entity<CalendarReccurrence>()
                .HasMany(e => e.CalendarReccurrenceFrequencies)
                .WithOptional(e => e.CalendarReccurrence)
                .HasForeignKey(e => e.CalendarReccursiveID)
                .WillCascadeOnDelete();

            modelBuilder.Entity<CalendarRecurrenceFrequencyType>()
                .HasMany(e => e.CalendarReccurrences)
                .WithOptional(e => e.CalendarRecurrenceFrequencyType)
                .HasForeignKey(e => e.Frequency);

            modelBuilder.Entity<cancellationpolicy>()
                .Property(e => e.CancellationFeeAfter)
                .HasPrecision(5, 2);

            modelBuilder.Entity<cancellationpolicy>()
                .Property(e => e.CancellationFeeBefore)
                .HasPrecision(5, 2);

            modelBuilder.Entity<cancellationpolicy>()
                .HasMany(e => e.bookings)
                .WithRequired(e => e.cancellationpolicy)
                .HasForeignKey(e => new { e.CancellationPolicyID, e.LanguageID, e.CountryID })
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<clienttype>()
                .HasMany(e => e.positionpricingtypes)
                .WithRequired(e => e.clienttype)
                .HasForeignKey(e => new { e.ClientTypeID, e.LanguageID, e.CountryID })
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<country>()
                .Property(e => e.CountryCodeAlpha2)
                .IsFixedLength();

            modelBuilder.Entity<county>()
                .HasMany(e => e.municipalities)
                .WithRequired(e => e.county)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<county>()
                .HasMany(e => e.postalcodes)
                .WithRequired(e => e.county)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<institution>()
                .HasMany(e => e.usereducations)
                .WithRequired(e => e.institution)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<Message>()
                .HasMany(e => e.MessagingThreads)
                .WithOptional(e => e.Message)
                .HasForeignKey(e => e.LastMessageID);

            modelBuilder.Entity<messagethreadstatus>()
                .HasMany(e => e.MessagingThreads)
                .WithRequired(e => e.messagethreadstatus)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<municipality>()
                .HasMany(e => e.postalcodes)
                .WithRequired(e => e.municipality)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<OwnerStatus>()
                .HasMany(e => e.users)
                .WithOptional(e => e.OwnerStatus)
                .HasForeignKey(e => e.OwnerStatusID);

            modelBuilder.Entity<position>()
                .HasMany(e => e.bookings)
                .WithRequired(e => e.position)
                .HasForeignKey(e => new { e.JobTitleID, e.LanguageID, e.CountryID })
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<position>()
                .HasMany(e => e.positionpricingtypes)
                .WithRequired(e => e.position)
                .HasForeignKey(e => new { e.PositionID, e.LanguageID, e.CountryID })
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<position>()
                .HasMany(e => e.userprofilepositions)
                .WithRequired(e => e.position)
                .HasForeignKey(e => new { e.PositionID, e.LanguageID, e.CountryID })
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<postalcode>()
                .Property(e => e.StandardOffset)
                .HasPrecision(18, 0);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.SubtotalPrice)
                .HasPrecision(7, 2);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.ClientServiceFeePrice)
                .HasPrecision(7, 2);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.TotalPrice)
                .HasPrecision(7, 2);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.ServiceFeeAmount)
                .HasPrecision(7, 2);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.CancellationFeeCharged)
                .HasPrecision(7, 2);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.FirstTimeServiceFeeFixed)
                .HasPrecision(5, 2);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.FirstTimeServiceFeePercentage)
                .HasPrecision(5, 2);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.PaymentProcessingFeePercentage)
                .HasPrecision(5, 2);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.PaymentProcessingFeeFixed)
                .HasPrecision(5, 2);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.FirstTimeServiceFeeMaximum)
                .HasPrecision(5, 2);

            modelBuilder.Entity<pricingSummary>()
                .Property(e => e.FirstTimeServiceFeeMinimum)
                .HasPrecision(5, 2);

            modelBuilder.Entity<pricingSummary>()
                .HasMany(e => e.bookings)
                .WithRequired(e => e.pricingSummary)
                .HasForeignKey(e => new { e.PricingSummaryID, e.PricingSummaryRevision })
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<pricingSummaryDetail>()
                .Property(e => e.HourlyPrice)
                .HasPrecision(5, 2);

            modelBuilder.Entity<pricingSummaryDetail>()
                .Property(e => e.Price)
                .HasPrecision(7, 2);

            modelBuilder.Entity<pricingtype>()
                .HasMany(e => e.positionpricingtypes)
                .WithRequired(e => e.pricingtype)
                .HasForeignKey(e => new { e.PricingTypeID, e.LanguageID, e.CountryID })
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<PricingVariableValue>()
                .Property(e => e.ProviderNumberIncluded)
                .HasPrecision(7, 2);

            modelBuilder.Entity<PricingVariableValue>()
                .Property(e => e.ProviderMinNumberAllowed)
                .HasPrecision(7, 2);

            modelBuilder.Entity<PricingVariableValue>()
                .Property(e => e.ProviderMaxNumberAllowed)
                .HasPrecision(7, 2);

            modelBuilder.Entity<providerpackage>()
                .Property(e => e.ProviderPackagePrice)
                .HasPrecision(7, 2);

            modelBuilder.Entity<providerpackage>()
                .Property(e => e.PriceRate)
                .HasPrecision(7, 2);

            modelBuilder.Entity<providerpaymentpreference>()
                .Property(e => e.ABANumber)
                .HasPrecision(9, 0);

            modelBuilder.Entity<ReferralSource>()
                .HasMany(e => e.ServiceProfessionalClients)
                .WithRequired(e => e.ReferralSource)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<servicecategory>()
                .HasMany(e => e.servicesubcategories)
                .WithOptional(e => e.servicecategory)
                .HasForeignKey(e => new { e.ServiceCategoryID, e.LanguageID, e.CountryID });

            modelBuilder.Entity<stateprovince>()
                .HasMany(e => e.counties)
                .WithRequired(e => e.stateprovince)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<stateprovince>()
                .HasMany(e => e.postalcodes)
                .WithRequired(e => e.stateprovince)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<usereducation>()
                .Property(e => e.FromYearAttended)
                .HasPrecision(4, 0);

            modelBuilder.Entity<usereducation>()
                .Property(e => e.ToYearAttended)
                .HasPrecision(4, 0);

            modelBuilder.Entity<UserFeePayment>()
                .Property(e => e.PaymentDate)
                .HasPrecision(0);

            modelBuilder.Entity<UserFeePayment>()
                .Property(e => e.PaymentAmount)
                .HasPrecision(19, 4);

            modelBuilder.Entity<UserFeePayment>()
                .Property(e => e.CreatedDate)
                .HasPrecision(0);

            modelBuilder.Entity<UserFeePayment>()
                .Property(e => e.ModifiedDate)
                .HasPrecision(0);

            modelBuilder.Entity<UserPaymentPlan>()
                .Property(e => e.PaymentPlanLastChangedDate)
                .HasPrecision(0);

            modelBuilder.Entity<UserPaymentPlan>()
                .Property(e => e.NextPaymentDueDate)
                .HasPrecision(0);

            modelBuilder.Entity<UserPaymentPlan>()
                .Property(e => e.NextPaymentAmount)
                .HasPrecision(19, 4);

            modelBuilder.Entity<UserPaymentPlan>()
                .Property(e => e.FirstBillingDate)
                .HasPrecision(0);

            modelBuilder.Entity<UserPaymentPlan>()
                .Property(e => e.SubscriptionEndDate)
                .HasPrecision(0);

            modelBuilder.Entity<UserPaymentPlan>()
                .Property(e => e.PaymentExpiryDate)
                .HasPrecision(0);

            modelBuilder.Entity<userprofileposition>()
                .HasMany(e => e.userprofileserviceattributes)
                .WithRequired(e => e.userprofileposition)
                .HasForeignKey(e => new { e.UserID, e.PositionID, e.LanguageID, e.CountryID })
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<UserReview>()
                .Property(e => e.ServiceHours)
                .HasPrecision(18, 5);

            modelBuilder.Entity<user>()
                .HasMany(e => e.bookings)
                .WithOptional(e => e.user)
                .HasForeignKey(e => e.AwaitingResponseFromUserID);

            modelBuilder.Entity<user>()
                .HasMany(e => e.bookings1)
                .WithOptional(e => e.user1)
                .HasForeignKey(e => e.ClientUserID);

            modelBuilder.Entity<user>()
                .HasMany(e => e.bookings2)
                .WithOptional(e => e.user2)
                .HasForeignKey(e => e.ServiceProfessionalUserID);

            modelBuilder.Entity<user>()
                .HasOptional(e => e.CalendarProviderAttribute)
                .WithRequired(e => e.user)
                .WillCascadeOnDelete();

            modelBuilder.Entity<user>()
                .HasMany(e => e.MessagingThreads)
                .WithRequired(e => e.user)
                .HasForeignKey(e => e.CustomerUserID)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<user>()
                .HasMany(e => e.MessagingThreads1)
                .WithRequired(e => e.user1)
                .HasForeignKey(e => e.ProviderUserID)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<user>()
                .HasOptional(e => e.OwnerAcknowledgment)
                .WithRequired(e => e.user);

            modelBuilder.Entity<user>()
                .HasMany(e => e.serviceaddresses)
                .WithRequired(e => e.user)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<user>()
                .HasMany(e => e.ServiceProfessionalClients)
                .WithRequired(e => e.user)
                .HasForeignKey(e => e.ServiceProfessionalUserID)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<user>()
                .HasMany(e => e.ServiceProfessionalClients1)
                .WithRequired(e => e.user1)
                .HasForeignKey(e => e.ClientUserID)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<user>()
                .HasMany(e => e.userbackgroundchecks)
                .WithRequired(e => e.user)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<user>()
                .HasMany(e => e.usereducations)
                .WithRequired(e => e.user)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<user>()
                .HasMany(e => e.UserLicenseCertifications)
                .WithRequired(e => e.user)
                .HasForeignKey(e => e.ProviderUserID)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<user>()
                .HasMany(e => e.UserLicenseCertifications1)
                .WithRequired(e => e.user1)
                .HasForeignKey(e => e.ProviderUserID)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<user>()
                .HasMany(e => e.userprofilepositions)
                .WithRequired(e => e.user)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<user>()
                .HasOptional(e => e.UserStat)
                .WithRequired(e => e.user);

            modelBuilder.Entity<webpages_Roles>()
                .HasMany(e => e.userprofiles)
                .WithMany(e => e.webpages_Roles)
                .Map(m => m.ToTable("webpages_UsersInRoles").MapLeftKey("RoleId").MapRightKey("UserId"));
        }
    }
}
