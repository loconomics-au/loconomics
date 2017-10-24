namespace WebMigrations.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    using System.IO;

    public partial class InitialCreate : DbMigration
    {
        public override void Up()
        {
            bool insertDataSQL = (System.Configuration.ConfigurationManager.AppSettings["InsertDataFromSQL"] ?? "false") == "true";
            bool insertDataCSV = (System.Configuration.ConfigurationManager.AppSettings["InsertDataFromCSV"] ?? "false") == "true";
            string[] countryIds = (System.Configuration.ConfigurationManager.AppSettings["CountryIds"] ?? "1,2").Split(',');
            string[] languageIds = (System.Configuration.ConfigurationManager.AppSettings["LanguageIds"] ?? "1,2").Split(',');

            #region
            CreateTable(
                "dbo.accountstatus",
                c => new
                    {
                        AccountStatusID = c.Int(nullable: false),
                        AccountStatusName = c.String(nullable: false, maxLength: 25),
                        AccountStatusDescription = c.String(maxLength: 200),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.AccountStatusID);
            
            CreateTable(
                "dbo.userprofilepositions",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        CreateDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 3),
                        Active = c.Boolean(),
                        PositionIntro = c.String(maxLength: 2000),
                        StatusID = c.Int(nullable: false),
                        CancellationPolicyID = c.Int(),
                        additionalinfo1 = c.String(maxLength: 500),
                        additionalinfo2 = c.String(maxLength: 500),
                        additionalinfo3 = c.String(maxLength: 500),
                        InstantBooking = c.Boolean(nullable: false),
                        bookMeButtonReady = c.Boolean(nullable: false),
                        collectPaymentAtBookMeButton = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.UserID, t.PositionID, t.LanguageID, t.CountryID })
                .ForeignKey("dbo.users", t => t.UserID)
                .ForeignKey("dbo.positions", t => new { t.PositionID, t.LanguageID, t.CountryID })
                .ForeignKey("dbo.accountstatus", t => t.StatusID)
                .Index(t => t.UserID)
                .Index(t => new { t.PositionID, t.LanguageID, t.CountryID })
                .Index(t => t.StatusID);
            
            CreateTable(
                "dbo.positions",
                c => new
                    {
                        PositionID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        PositionSingular = c.String(maxLength: 200),
                        PositionPlural = c.String(maxLength: 200),
                        Aliases = c.String(maxLength: 200),
                        PositionDescription = c.String(maxLength: 2000),
                        CreatedDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 2),
                        GovID = c.String(maxLength: 20),
                        GovPosition = c.String(maxLength: 200),
                        GovPositionDescription = c.String(maxLength: 2000),
                        Active = c.Boolean(),
                        DisplayRank = c.Int(),
                        PositionSearchDescription = c.String(maxLength: 1000),
                        AttributesComplete = c.Boolean(nullable: false),
                        StarRatingsComplete = c.Boolean(nullable: false),
                        PricingTypeComplete = c.Boolean(nullable: false),
                        EnteredByUserID = c.Int(),
                        Approved = c.Boolean(),
                        AddGratuity = c.Int(nullable: false),
                        HIPAA = c.Boolean(nullable: false),
                        SendReviewReminderToClient = c.Boolean(nullable: false),
                        CanBeRemote = c.Boolean(nullable: false),
                        SuppressReviewOfClient = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.PositionID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.booking",
                c => new
                    {
                        BookingID = c.Int(nullable: false, identity: true), 
                        ClientUserID = c.Int(),
                        ServiceProfessionalUserID = c.Int(),
                        JobTitleID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        BookingStatusID = c.Int(nullable: false),
                        BookingTypeID = c.Int(nullable: false),
                        CancellationPolicyID = c.Int(nullable: false),
                        ParentBookingID = c.Int(),
                        ServiceAddressID = c.Int(),
                        ServiceDateID = c.Int(),
                        AlternativeDate1ID = c.Int(),
                        AlternativeDate2ID = c.Int(),
                        PricingSummaryID = c.Int(nullable: false),
                        PricingSummaryRevision = c.Int(nullable: false),
                        PaymentTransactionID = c.String(maxLength: 250),
                        PaymentLastFourCardNumberDigits = c.String(maxLength: 64),
                        paymentMethodID = c.String(maxLength: 250),
                        cancellationPaymentTransactionID = c.String(maxLength: 250),
                        ClientPayment = c.Decimal(precision: 25, scale: 2),
                        ServiceProfessionalPaid = c.Decimal(precision: 25, scale: 2),
                        ServiceProfessionalPPFeePaid = c.Decimal(precision: 25, scale: 2),
                        LoconomicsPaid = c.Decimal(precision: 25, scale: 2),
                        LoconomicsPPFeePaid = c.Decimal(precision: 25, scale: 2),
                        InstantBooking = c.Boolean(nullable: false),
                        FirstTimeBooking = c.Boolean(nullable: false),
                        SendReminder = c.Boolean(nullable: false),
                        SendPromotional = c.Boolean(nullable: false),
                        Recurrent = c.Boolean(nullable: false),
                        MultiSession = c.Boolean(nullable: false),
                        PricingAdjustmentApplied = c.Boolean(nullable: false),
                        PaymentEnabled = c.Boolean(nullable: false),
                        PaymentCollected = c.Boolean(nullable: false),
                        PaymentAuthorized = c.Boolean(nullable: false),
                        AwaitingResponseFromUserID = c.Int(),
                        PricingAdjustmentRequested = c.Boolean(nullable: false),
                        SupportTicketNumber = c.String(maxLength: 200),
                        MessagingLog = c.String(nullable: false, maxLength: 400),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        SpecialRequests = c.String(),
                        PreNotesToClient = c.String(),
                        PostNotesToClient = c.String(),
                        PreNotesToSelf = c.String(),
                        PostNotesToSelf = c.String(),
                    })
                .PrimaryKey(t => t.BookingID)
                .ForeignKey("dbo.address", t => t.ServiceAddressID)
                .ForeignKey("dbo.booking", t => t.ParentBookingID)
                .ForeignKey("dbo.bookingStatus", t => t.BookingStatusID)
                .ForeignKey("dbo.bookingType", t => t.BookingTypeID)
                .ForeignKey("dbo.CalendarEvents", t => t.AlternativeDate1ID)
                .ForeignKey("dbo.CalendarEvents", t => t.AlternativeDate2ID)
                .ForeignKey("dbo.CalendarEvents", t => t.ServiceDateID)
                .ForeignKey("dbo.cancellationpolicy", t => new { t.CancellationPolicyID, t.LanguageID, t.CountryID })
                .ForeignKey("dbo.pricingSummary", t => new { t.PricingSummaryID, t.PricingSummaryRevision })
                .ForeignKey("dbo.users", t => t.AwaitingResponseFromUserID)
                .ForeignKey("dbo.users", t => t.ClientUserID)
                .ForeignKey("dbo.users", t => t.ServiceProfessionalUserID)
                .ForeignKey("dbo.positions", t => new { t.JobTitleID, t.LanguageID, t.CountryID })
                .Index(t => t.ClientUserID)
                .Index(t => t.ServiceProfessionalUserID)
                .Index(t => new { t.JobTitleID, t.LanguageID, t.CountryID })
                .Index(t => new { t.CancellationPolicyID, t.LanguageID, t.CountryID })
                .Index(t => t.BookingStatusID)
                .Index(t => t.BookingTypeID)
                .Index(t => t.ParentBookingID)
                .Index(t => t.ServiceAddressID)
                .Index(t => t.ServiceDateID)
                .Index(t => t.AlternativeDate1ID)
                .Index(t => t.AlternativeDate2ID)
                .Index(t => new { t.PricingSummaryID, t.PricingSummaryRevision })
                .Index(t => t.AwaitingResponseFromUserID);
            
            CreateTable(
                "dbo.address",
                c => new
                    {
                        AddressID = c.Int(nullable: false, identity: true),
                        UserID = c.Int(nullable: false),
                        AddressTypeID = c.Int(nullable: false),
                        AddressName = c.String(nullable: false, maxLength: 50),
                        AddressLine1 = c.String(nullable: false, maxLength: 100),
                        AddressLine2 = c.String(maxLength: 100),
                        City = c.String(nullable: false, maxLength: 100),
                        StateProvinceID = c.Int(nullable: false),
                        PostalCodeID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        Latitude = c.Double(),
                        Longitude = c.Double(),
                        GoogleMapsURL = c.String(maxLength: 2073),
                        SpecialInstructions = c.String(maxLength: 1000),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(),
                        CreatedBy = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.AddressID);
            
            CreateTable(
                "dbo.bookingStatus",
                c => new
                    {
                        BookingStatusID = c.Int(nullable: false),
                        BookingStatusName = c.String(nullable: false, maxLength: 50),
                        BookingStatusDescription = c.String(maxLength: 500),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.BookingStatusID);
            
            CreateTable(
                "dbo.bookingType",
                c => new
                    {
                        BookingTypeID = c.Int(nullable: false),
                        BookingTypeName = c.String(nullable: false, maxLength: 50),
                        BookingTypeDescription = c.String(maxLength: 500),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        FirstTimeServiceFeeFixed = c.Decimal(nullable: false, precision: 5, scale: 2),
                        FirstTimeServiceFeePercentage = c.Decimal(nullable: false, precision: 5, scale: 2),
                        PaymentProcessingFeePercentage = c.Decimal(nullable: false, precision: 5, scale: 2),
                        PaymentProcessingFeeFixed = c.Decimal(nullable: false, precision: 5, scale: 2),
                        FirstTimeServiceFeeMaximum = c.Decimal(nullable: false, precision: 5, scale: 2),
                        FirstTimeServiceFeeMinimum = c.Decimal(nullable: false, precision: 5, scale: 2),
                    })
                .PrimaryKey(t => t.BookingTypeID);
            
            CreateTable(
                "dbo.CalendarEvents",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        UserId = c.Int(nullable: false),
                        EventType = c.Int(nullable: false),
                        Summary = c.String(maxLength: 500),
                        StarTtime = c.DateTimeOffset(precision: 0),
                        EndTime = c.DateTimeOffset(precision: 0),
                        UID = c.String(maxLength: 150),
                        CalendarAvailabilityTypeID = c.Int(nullable: false),
                        Transparency = c.Boolean(nullable: false),
                        IsAllDay = c.Boolean(nullable: false),
                        StampTime = c.DateTimeOffset(precision: 0),
                        TimeZone = c.String(maxLength: 100),
                        Priority = c.Int(),
                        Location = c.String(maxLength: 100),
                        UpdatedDate = c.DateTimeOffset(precision: 0),
                        CreatedDate = c.DateTimeOffset(precision: 0),
                        ModifyBy = c.String(maxLength: 50),
                        Class = c.String(maxLength: 50),
                        Organizer = c.String(),
                        Sequence = c.Int(),
                        Geo = c.String(maxLength: 100),
                        RecurrenceId = c.DateTimeOffset(precision: 0),
                        TimeBlock = c.Time(precision: 7),
                        DayofWeek = c.Int(),
                        Description = c.String(),
                        Deleted = c.DateTimeOffset(precision: 0),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.CalendarAvailabilityType", t => t.CalendarAvailabilityTypeID, cascadeDelete: true)
                .ForeignKey("dbo.CalendarEventType", t => t.EventType, cascadeDelete: true)
                .Index(t => t.EventType)
                .Index(t => t.CalendarAvailabilityTypeID);
            
            CreateTable(
                "dbo.CalendarAvailabilityType",
                c => new
                    {
                        CalendarAvailabilityTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        CalendarAvailabilityTypeName = c.String(nullable: false, maxLength: 50),
                        CalendarAvailabilityTypeDescription = c.String(nullable: false, maxLength: 300),
                        UserDescription = c.String(maxLength: 500),
                        AddAppointmentType = c.Boolean(nullable: false),
                        SelectableAs = c.String(maxLength: 50),
                    })
                .PrimaryKey(t => t.CalendarAvailabilityTypeID);
            
            CreateTable(
                "dbo.CalendarEventComments",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        IdEvent = c.Int(nullable: false),
                        Comment = c.String(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.CalendarEvents", t => t.IdEvent, cascadeDelete: true)
                .Index(t => t.IdEvent);
            
            CreateTable(
                "dbo.CalendarEventExceptionsPeriodsList",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        IdEvent = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.CalendarEvents", t => t.IdEvent, cascadeDelete: true)
                .Index(t => t.IdEvent);
            
            CreateTable(
                "dbo.CalendarEventExceptionsPeriod",
                c => new
                    {
                        IdException = c.Int(nullable: false),
                        DateStart = c.DateTimeOffset(nullable: false, precision: 0),
                        DateEnd = c.DateTimeOffset(precision: 0),
                    })
                .PrimaryKey(t => new { t.IdException, t.DateStart })
                .ForeignKey("dbo.CalendarEventExceptionsPeriodsList", t => t.IdException, cascadeDelete: true)
                .Index(t => t.IdException);
            
            CreateTable(
                "dbo.CalendarEventRecurrencesPeriodList",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        IdEvent = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.CalendarEvents", t => t.IdEvent, cascadeDelete: true)
                .Index(t => t.IdEvent);
            
            CreateTable(
                "dbo.CalendarEventRecurrencesPeriod",
                c => new
                    {
                        IdRecurrence = c.Int(nullable: false),
                        DateStart = c.DateTimeOffset(nullable: false, precision: 0),
                        DateEnd = c.DateTimeOffset(precision: 0),
                    })
                .PrimaryKey(t => new { t.IdRecurrence, t.DateStart })
                .ForeignKey("dbo.CalendarEventRecurrencesPeriodList", t => t.IdRecurrence, cascadeDelete: true)
                .Index(t => t.IdRecurrence);
            
            CreateTable(
                "dbo.CalendarEventsAttendees",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        IdEvent = c.Int(nullable: false),
                        Attendee = c.String(),
                        Role = c.String(maxLength: 50),
                        Uri = c.String(maxLength: 200),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.CalendarEvents", t => t.IdEvent, cascadeDelete: true)
                .Index(t => t.IdEvent);
            
            CreateTable(
                "dbo.CalendarEventsContacts",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        IdEvent = c.Int(nullable: false),
                        Contact = c.String(maxLength: 500),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.CalendarEvents", t => t.IdEvent, cascadeDelete: true)
                .Index(t => t.IdEvent);
            
            CreateTable(
                "dbo.CalendarEventType",
                c => new
                    {
                        EventTypeId = c.Int(nullable: false),
                        EventType = c.String(maxLength: 100),
                        Description = c.String(),
                        DisplayName = c.String(maxLength: 100),
                    })
                .PrimaryKey(t => t.EventTypeId);
            
            CreateTable(
                "dbo.CalendarReccurrence",
                c => new
                    {
                        ID = c.Int(nullable: false, identity: true),
                        EventID = c.Int(),
                        Count = c.Int(),
                        EvaluationMode = c.String(maxLength: 50),
                        Frequency = c.Int(),
                        Interval = c.Int(),
                        RestristionType = c.Int(),
                        Until = c.DateTimeOffset(precision: 0),
                        FirstDayOfWeek = c.Int(),
                    })
                .PrimaryKey(t => t.ID)
                .ForeignKey("dbo.CalendarRecurrenceFrequencyTypes", t => t.Frequency)
                .ForeignKey("dbo.CalendarEvents", t => t.EventID, cascadeDelete: true)
                .Index(t => t.EventID)
                .Index(t => t.Frequency);
            
            CreateTable(
                "dbo.CalendarReccurrenceFrequency",
                c => new
                    {
                        ID = c.Int(nullable: false, identity: true),
                        CalendarReccursiveID = c.Int(),
                        ByDay = c.Boolean(),
                        ByHour = c.Boolean(),
                        ByMinute = c.Boolean(),
                        ByMonth = c.Boolean(),
                        ByMonthDay = c.Boolean(),
                        BySecond = c.Boolean(),
                        BySetPosition = c.Boolean(),
                        ByWeekNo = c.Boolean(),
                        ByYearDay = c.Boolean(),
                        ExtraValue = c.Int(),
                        FrequencyDay = c.Int(),
                        DayOfWeek = c.Int(),
                    })
                .PrimaryKey(t => t.ID)
                .ForeignKey("dbo.CalendarReccurrence", t => t.CalendarReccursiveID, cascadeDelete: true)
                .Index(t => t.CalendarReccursiveID);
            
            CreateTable(
                "dbo.CalendarRecurrenceFrequencyTypes",
                c => new
                    {
                        ID = c.Int(nullable: false),
                        FrequencyType = c.String(maxLength: 30),
                        UnitPlural = c.String(maxLength: 30),
                    })
                .PrimaryKey(t => t.ID);
            
            CreateTable(
                "dbo.cancellationpolicy",
                c => new
                    {
                        CancellationPolicyID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        CancellationPolicyName = c.String(nullable: false, maxLength: 50),
                        CancellationPolicyDescription = c.String(maxLength: 1000),
                        HoursRequired = c.Int(),
                        CancellationFeeAfter = c.Decimal(precision: 5, scale: 2),
                        CancellationFeeBefore = c.Decimal(precision: 5, scale: 2),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.CancellationPolicyID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.pricingSummary",
                c => new
                    {
                        PricingSummaryID = c.Int(nullable: false),
                        PricingSummaryRevision = c.Int(nullable: false),
                        ServiceDurationMinutes = c.Int(),
                        FirstSessionDurationMinutes = c.Int(),
                        SubtotalPrice = c.Decimal(precision: 7, scale: 2),
                        ClientServiceFeePrice = c.Decimal(precision: 7, scale: 2),
                        TotalPrice = c.Decimal(precision: 7, scale: 2),
                        ServiceFeeAmount = c.Decimal(precision: 7, scale: 2),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        CancellationDate = c.DateTime(),
                        CancellationFeeCharged = c.Decimal(precision: 7, scale: 2),
                        FirstTimeServiceFeeFixed = c.Decimal(nullable: false, precision: 5, scale: 2),
                        FirstTimeServiceFeePercentage = c.Decimal(nullable: false, precision: 5, scale: 2),
                        PaymentProcessingFeePercentage = c.Decimal(nullable: false, precision: 5, scale: 2),
                        PaymentProcessingFeeFixed = c.Decimal(nullable: false, precision: 5, scale: 2),
                        FirstTimeServiceFeeMaximum = c.Decimal(nullable: false, precision: 5, scale: 2),
                        FirstTimeServiceFeeMinimum = c.Decimal(nullable: false, precision: 5, scale: 2),
                    })
                .PrimaryKey(t => new { t.PricingSummaryID, t.PricingSummaryRevision });
            
            CreateTable(
                "dbo.ServiceProfessionalClient",
                c => new
                    {
                        ServiceProfessionalUserID = c.Int(nullable: false),
                        ClientUserID = c.Int(nullable: false),
                        NotesAboutClient = c.String(nullable: false),
                        ReferralSourceID = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        Active = c.Boolean(nullable: false),
                        CreatedByBookingID = c.Int(),
                        DeletedByServiceProfessional = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.ServiceProfessionalUserID, t.ClientUserID })
                .ForeignKey("dbo.ReferralSource", t => t.ReferralSourceID)
                .ForeignKey("dbo.users", t => t.ServiceProfessionalUserID)
                .ForeignKey("dbo.users", t => t.ClientUserID)
                .ForeignKey("dbo.booking", t => t.CreatedByBookingID)
                .Index(t => t.ServiceProfessionalUserID)
                .Index(t => t.ClientUserID)
                .Index(t => t.ReferralSourceID)
                .Index(t => t.CreatedByBookingID);
            
            CreateTable(
                "dbo.ReferralSource",
                c => new
                    {
                        ReferralSourceID = c.Int(nullable: false),
                        Name = c.String(nullable: false, maxLength: 80),
                    })
                .PrimaryKey(t => t.ReferralSourceID);
            
            CreateTable(
                "dbo.users",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        FirstName = c.String(nullable: false, maxLength: 50),
                        MiddleIn = c.String(nullable: false, maxLength: 1),
                        LastName = c.String(nullable: false, maxLength: 145),
                        SecondLastName = c.String(nullable: false, maxLength: 145),
                        NickName = c.String(maxLength: 50),
                        PublicBio = c.String(maxLength: 4000),
                        GenderID = c.Int(nullable: false),
                        PreferredLanguageID = c.Int(),
                        PreferredCountryID = c.Int(),
                        IsProvider = c.Boolean(nullable: false),
                        IsCustomer = c.Boolean(nullable: false),
                        IsAdmin = c.Boolean(nullable: false),
                        IsCollaborator = c.Boolean(nullable: false),
                        Photo = c.String(maxLength: 150),
                        MobilePhone = c.String(maxLength: 20),
                        AlternatePhone = c.String(maxLength: 20),
                        CanReceiveSms = c.Boolean(nullable: false),
                        ProviderProfileURL = c.String(maxLength: 2078),
                        ProviderWebsiteURL = c.String(maxLength: 2078),
                        SMSBookingCommunication = c.Boolean(nullable: false),
                        PhoneBookingCommunication = c.Boolean(nullable: false),
                        LoconomicsMarketingCampaigns = c.Boolean(nullable: false),
                        ProfileSEOPermission = c.Boolean(nullable: false),
                        CreatedDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 50),
                        Active = c.Boolean(),
                        LoconomicsCommunityCommunication = c.Boolean(nullable: false),
                        IAuthZumigoVerification = c.Boolean(),
                        IAuthZumigoLocation = c.Boolean(),
                        LoconomicsDBMCampaigns = c.Boolean(nullable: false),
                        AccountStatusID = c.Int(nullable: false),
                        CoBrandedPartnerPermissions = c.Boolean(nullable: false),
                        MarketingSource = c.String(maxLength: 2055),
                        BookCode = c.String(maxLength: 64),
                        OnboardingStep = c.String(maxLength: 60),
                        BirthMonthDay = c.Int(),
                        BirthMonth = c.Int(),
                        BusinessName = c.String(maxLength: 145),
                        AlternativeEmail = c.String(maxLength: 56),
                        ReferredByUserID = c.Int(),
                        SignupDevice = c.String(maxLength: 20),
                        OwnerStatusID = c.Int(),
                        OwnerAnniversaryDate = c.DateTime(),
                        IsHipaaAdmin = c.Boolean(nullable: false),
                        IsContributor = c.Boolean(),
                        TrialEndDate = c.DateTimeOffset(precision: 7),
                    })
                .PrimaryKey(t => t.UserID)
                .ForeignKey("dbo.OwnerStatus", t => t.OwnerStatusID)
                .ForeignKey("dbo.accountstatus", t => t.AccountStatusID)
                .Index(t => t.AccountStatusID)
                .Index(t => t.OwnerStatusID);
            
            CreateTable(
                "dbo.CalendarProviderAttributes",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        AdvanceTime = c.Decimal(nullable: false, precision: 10, scale: 2),
                        MinTime = c.Decimal(nullable: false, precision: 10, scale: 2),
                        MaxTime = c.Decimal(nullable: false, precision: 10, scale: 2),
                        BetweenTime = c.Decimal(nullable: false, precision: 10, scale: 2),
                        UseCalendarProgram = c.Boolean(nullable: false),
                        CalendarType = c.String(maxLength: 200),
                        CalendarURL = c.String(maxLength: 500),
                        PrivateCalendarToken = c.String(maxLength: 128),
                        IncrementsSizeInMinutes = c.Int(nullable: false),
                        TimeZone = c.String(maxLength: 50),
                    })
                .PrimaryKey(t => t.UserID)
                .ForeignKey("dbo.users", t => t.UserID, cascadeDelete: true)
                .Index(t => t.UserID);
            
            CreateTable(
                "dbo.MessagingThreads",
                c => new
                    {
                        ThreadID = c.Int(nullable: false, identity: true),
                        CustomerUserID = c.Int(nullable: false),
                        ProviderUserID = c.Int(nullable: false),
                        PositionID = c.Int(),
                        MessageThreadStatusID = c.Int(nullable: false),
                        Subject = c.String(maxLength: 100),
                        LastMessageID = c.Int(),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 50),
                    })
                .PrimaryKey(t => t.ThreadID)
                .ForeignKey("dbo.Messages", t => t.LastMessageID)
                .ForeignKey("dbo.messagethreadstatus", t => t.MessageThreadStatusID)
                .ForeignKey("dbo.users", t => t.CustomerUserID)
                .ForeignKey("dbo.users", t => t.ProviderUserID)
                .Index(t => t.CustomerUserID)
                .Index(t => t.ProviderUserID)
                .Index(t => t.MessageThreadStatusID)
                .Index(t => t.LastMessageID);
            
            CreateTable(
                "dbo.Messages",
                c => new
                    {
                        MessageID = c.Int(nullable: false, identity: true),
                        ThreadID = c.Int(nullable: false),
                        MessageTypeID = c.Int(nullable: false),
                        AuxID = c.Int(),
                        AuxT = c.String(maxLength: 50),
                        BodyText = c.String(nullable: false, maxLength: 4000),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 50),
                        SentByUserId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.MessageID);
            
            CreateTable(
                "dbo.messagethreadstatus",
                c => new
                    {
                        MessageThreadStatusID = c.Int(nullable: false),
                        MessageThreadStatusName = c.String(nullable: false, maxLength: 25),
                        MessageThreadStatusDescription = c.String(maxLength: 100),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        MessageStatusColor = c.String(nullable: false, maxLength: 7),
                    })
                .PrimaryKey(t => t.MessageThreadStatusID);
            
            CreateTable(
                "dbo.OwnerAcknowledgment",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        DateAcknowledged = c.DateTimeOffset(nullable: false, precision: 7),
                        AcknowledgedFromIP = c.String(nullable: false, maxLength: 25),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        UpdatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        DetectedIPs = c.String(nullable: false, maxLength: 200),
                    })
                .PrimaryKey(t => t.UserID)
                .ForeignKey("dbo.users", t => t.UserID)
                .Index(t => t.UserID);
            
            CreateTable(
                "dbo.OwnerStatus",
                c => new
                    {
                        OwnserStatusID = c.Int(nullable: false),
                        OwnerStatusName = c.String(nullable: false, maxLength: 50),
                        OwnerStatusDescription = c.String(maxLength: 200),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        Active = c.Boolean(nullable: false),
                        UpdatedBy = c.String(maxLength: 3),
                    })
                .PrimaryKey(t => t.OwnserStatusID);
            
            CreateTable(
                "dbo.serviceaddress",
                c => new
                    {
                        AddressID = c.Int(nullable: false),
                        UserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        ServicesPerformedAtLocation = c.Boolean(nullable: false),
                        TravelFromLocation = c.Boolean(nullable: false),
                        ServiceRadiusFromLocation = c.String(maxLength: 25),
                        TransportType = c.Int(),
                        PreferredAddress = c.Boolean(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.AddressID, t.UserID, t.PositionID })
                .ForeignKey("dbo.users", t => t.UserID)
                .Index(t => t.UserID);
            
            CreateTable(
                "dbo.userbackgroundcheck",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        BackgroundCheckID = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        ModifiedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        StatusID = c.Int(nullable: false),
                        Summary = c.String(maxLength: 200),
                        VerifiedBy = c.String(maxLength: 25),
                        LastVerifiedDate = c.DateTime(),
                    })
                .PrimaryKey(t => new { t.UserID, t.BackgroundCheckID })
                .ForeignKey("dbo.users", t => t.UserID)
                .Index(t => t.UserID);
            
            CreateTable(
                "dbo.usereducation",
                c => new
                    {
                        UserEducationID = c.Int(nullable: false, identity: true),
                        UserID = c.Int(nullable: false),
                        InstitutionID = c.Int(nullable: false),
                        DegreeCertificate = c.String(nullable: false, maxLength: 200),
                        FieldOfStudy = c.String(nullable: false, maxLength: 200),
                        FromYearAttended = c.Decimal(precision: 4, scale: 0),
                        ToYearAttended = c.Decimal(precision: 4, scale: 0),
                        CreatedDate = c.DateTime(nullable: false),
                        ModifiedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        VerifiedDate = c.DateTime(),
                        VerifiedBy = c.String(maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.UserEducationID)
                .ForeignKey("dbo.institution", t => t.InstitutionID)
                .ForeignKey("dbo.users", t => t.UserID)
                .Index(t => t.UserID)
                .Index(t => t.InstitutionID);
            
            CreateTable(
                "dbo.institution",
                c => new
                    {
                        InstitutionID = c.Int(nullable: false, identity: true),
                        DeptOfEdInstitutionID = c.String(maxLength: 25),
                        InstitutionName = c.String(nullable: false, maxLength: 200),
                        InstitutionAddress = c.String(maxLength: 200),
                        InstitutionCity = c.String(maxLength: 100),
                        InstitutionState = c.String(maxLength: 25),
                        StateProvinceID = c.Int(),
                        InstitutionZip = c.String(maxLength: 25),
                        InstitutionPhone = c.String(maxLength: 25),
                        InstitutionOPEID = c.String(maxLength: 25),
                        InstitutionIPEDSUnitID = c.String(maxLength: 25),
                        InstitutionURL = c.String(maxLength: 2083),
                        CountryID = c.Int(),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                    })
                .PrimaryKey(t => t.InstitutionID)
                .ForeignKey("dbo.stateprovince", t => t.StateProvinceID)
                .Index(t => t.StateProvinceID);
            
            CreateTable(
                "dbo.stateprovince",
                c => new
                    {
                        StateProvinceID = c.Int(nullable: false),
                        StateProvinceName = c.String(maxLength: 100),
                        StateProvinceCode = c.String(maxLength: 25),
                        CountryID = c.Int(nullable: false),
                        RegionCode = c.String(maxLength: 25),
                        PostalCodePrefix = c.String(maxLength: 25),
                    })
                .PrimaryKey(t => t.StateProvinceID);
            
            CreateTable(
                "dbo.county",
                c => new
                    {
                        CountyID = c.Int(nullable: false),
                        CountyName = c.String(maxLength: 100),
                        FIPSCode = c.Int(),
                        StateProvinceID = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.CountyID)
                .ForeignKey("dbo.stateprovince", t => t.StateProvinceID)
                .Index(t => t.StateProvinceID);
            
            CreateTable(
                "dbo.municipality",
                c => new
                    {
                        MunicipalityID = c.Int(nullable: false),
                        CountyID = c.Int(nullable: false),
                        MunicipalityName = c.String(nullable: false, maxLength: 100),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                    })
                .PrimaryKey(t => t.MunicipalityID)
                .ForeignKey("dbo.county", t => t.CountyID)
                .Index(t => t.CountyID);
            
            CreateTable(
                "dbo.postalcode",
                c => new
                    {
                        PostalCodeID = c.Int(nullable: false),
                        PostalCode = c.String(maxLength: 25),
                        City = c.String(maxLength: 250),
                        StateProvinceID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        Latitude = c.Double(),
                        Longitude = c.Double(),
                        StandardOffset = c.Decimal(precision: 18, scale: 0),
                        DST = c.Boolean(),
                        Location = c.String(maxLength: 250),
                        PostalCodeType = c.String(maxLength: 50),
                        CreatedDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 25),
                        MunicipalityID = c.Int(nullable: false),
                        CountyID = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.PostalCodeID)
                .ForeignKey("dbo.municipality", t => t.MunicipalityID)
                .ForeignKey("dbo.county", t => t.CountyID)
                .ForeignKey("dbo.stateprovince", t => t.StateProvinceID)
                .Index(t => t.StateProvinceID)
                .Index(t => t.MunicipalityID)
                .Index(t => t.CountyID);
            
            CreateTable(
                "dbo.UserLicenseCertifications",
                c => new
                    {
                        userLicenseCertificationID = c.Int(nullable: false, identity: true),
                        ProviderUserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        LicenseCertificationID = c.Int(nullable: false),
                        VerificationStatusID = c.Int(nullable: false),
                        LicenseCertificationURL = c.String(maxLength: 2073),
                        LastName = c.String(nullable: false, maxLength: 100),
                        FirstName = c.String(nullable: false, maxLength: 100),
                        MiddleInitial = c.String(maxLength: 1),
                        SecondLastName = c.String(maxLength: 100),
                        BusinessName = c.String(maxLength: 200),
                        LicenseCertificationNumber = c.String(maxLength: 100),
                        CreatedDate = c.DateTime(nullable: false),
                        ExpirationDate = c.DateTime(),
                        IssueDate = c.DateTime(),
                        Comments = c.String(maxLength: 500),
                        VerifiedBy = c.String(maxLength: 25),
                        LastVerifiedDate = c.DateTime(),
                        SubmittedBy = c.String(maxLength: 25),
                        SubmittedImageLocalURL = c.String(maxLength: 255),
                    })
                .PrimaryKey(t => t.userLicenseCertificationID)
                .ForeignKey("dbo.users", t => t.ProviderUserID)
                .Index(t => t.ProviderUserID);
            
            CreateTable(
                "dbo.UserStats",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        ResponseTimeMinutes = c.Decimal(precision: 18, scale: 2),
                        LastLoginTime = c.DateTime(),
                        LastActivityTime = c.DateTime(),
                    })
                .PrimaryKey(t => t.UserID)
                .ForeignKey("dbo.users", t => t.UserID)
                .Index(t => t.UserID);
            
            CreateTable(
                "dbo.positionpricingtype",
                c => new
                    {
                        PositionID = c.Int(nullable: false),
                        PricingTypeID = c.Int(nullable: false),
                        ClientTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.PositionID, t.PricingTypeID, t.ClientTypeID, t.LanguageID, t.CountryID })
                .ForeignKey("dbo.clienttype", t => new { t.ClientTypeID, t.LanguageID, t.CountryID })
                .ForeignKey("dbo.pricingtype", t => new { t.PricingTypeID, t.LanguageID, t.CountryID })
                .ForeignKey("dbo.positions", t => new { t.PositionID, t.LanguageID, t.CountryID })
                .Index(t => new { t.PositionID, t.LanguageID, t.CountryID })
                .Index(t => new { t.PricingTypeID, t.LanguageID, t.CountryID })
                .Index(t => new { t.ClientTypeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.clienttype",
                c => new
                    {
                        CllientTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        ClientTypeName = c.String(nullable: false, maxLength: 50),
                        ClientTypeDescription = c.String(maxLength: 500),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.CllientTypeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.pricingtype",
                c => new
                    {
                        PricingTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        Description = c.String(maxLength: 50),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 50),
                        Active = c.Boolean(nullable: false),
                        DisplayRank = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.PricingTypeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.userprofileserviceattributes",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        ServiceAttributeCategoryID = c.Int(nullable: false),
                        ServiceAttributeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        CreateDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 3),
                        Active = c.Boolean(),
                    })
                .PrimaryKey(t => new { t.UserID, t.PositionID, t.ServiceAttributeCategoryID, t.ServiceAttributeID, t.LanguageID, t.CountryID })
                .ForeignKey("dbo.userprofilepositions", t => new { t.UserID, t.PositionID, t.LanguageID, t.CountryID })
                .Index(t => new { t.UserID, t.PositionID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.addresstype",
                c => new
                    {
                        AddressTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        AddressType = c.String(maxLength: 50),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        UniquePerUser = c.Boolean(nullable: false),
                        Selectable = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.AddressTypeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.alert",
                c => new
                    {
                        AlertID = c.Int(nullable: false),
                        AlertTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        AlertName = c.String(nullable: false, maxLength: 30),
                        AlertHeadlineDisplay = c.String(maxLength: 100),
                        AlertTextDisplay = c.String(nullable: false, maxLength: 300),
                        AlertDescription = c.String(maxLength: 500),
                        AlertEmailText = c.String(maxLength: 25),
                        ProviderProfileCompletePoints = c.Int(nullable: false),
                        CustomerProfileCompletePoints = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        AlertPageURL = c.String(maxLength: 2000),
                        Required = c.Boolean(nullable: false),
                        PositionSpecific = c.Boolean(nullable: false),
                        DisplayRank = c.Int(nullable: false),
                        ProviderAlert = c.Boolean(nullable: false),
                        CustomerAlert = c.Boolean(nullable: false),
                        bookMeButtonRequired = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.AlertID, t.AlertTypeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.alerttype",
                c => new
                    {
                        AlertTypeID = c.Int(nullable: false),
                        AlertTypeName = c.String(nullable: false, maxLength: 200),
                        AlertTypeDescription = c.String(maxLength: 200),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        DisplayRank = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.AlertTypeID);
            
            CreateTable(
                "dbo.backgroundcheck",
                c => new
                    {
                        BackgroundCheckID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        BackgroundCheckName = c.String(nullable: false, maxLength: 100),
                        BackgroundCheckDescription = c.String(maxLength: 1000),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        BackGroundCheckPrice = c.Decimal(precision: 5, scale: 2),
                    })
                .PrimaryKey(t => new { t.BackgroundCheckID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.country",
                c => new
                    {
                        CountryID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryName = c.String(nullable: false, maxLength: 100),
                        CountryCode = c.String(nullable: false, maxLength: 3),
                        CountryCodeAlpha2 = c.String(maxLength: 2, fixedLength: true),
                        CountryCallingCode = c.String(maxLength: 3),
                        CreatedDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        numcode = c.Int(),
                    })
                .PrimaryKey(t => new { t.CountryID, t.LanguageID });
            
            CreateTable(
                "dbo.ExperienceLevel", 
                c => new
                    {
                        ExperienceLevelID = c.Int(nullable: false, identity: true),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        ExperienceLevelName = c.String(nullable: false, maxLength: 140),
                        ExperienceLevelDescription = c.String(maxLength: 140),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                    })
                .PrimaryKey(t => new { t.ExperienceLevelID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.Gender",
                c => new
                    {
                        GenderID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        GenderSingular = c.String(nullable: false, maxLength: 16),
                        GenderPlural = c.String(nullable: false, maxLength: 16),
                        SubjectPronoun = c.String(maxLength: 25),
                        ObjectPronoun = c.String(maxLength: 25),
                        PossesivePronoun = c.String(maxLength: 25),
                    })
                .PrimaryKey(t => new { t.GenderID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.jobTitleLicense",
                c => new
                    {
                        PositionID = c.Int(nullable: false),
                        LicenseCertificationID = c.Int(nullable: false),
                        StateProvinceID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        MunicipalityID = c.Int(nullable: false),
                        CountyID = c.Int(nullable: false),
                        Required = c.Boolean(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        OptionGroup = c.String(maxLength: 100),
                    })
                .PrimaryKey(t => new { t.PositionID, t.LicenseCertificationID, t.StateProvinceID, t.CountryID, t.MunicipalityID, t.CountyID });
            
            CreateTable(
                "dbo.languagelevel",
                c => new
                    {
                        LanguageLevelID = c.Int(nullable: false, identity: true),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        LanguageLevelName = c.String(nullable: false, maxLength: 140),
                        LanguageLevelDescription = c.String(maxLength: 2000),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                    })
                .PrimaryKey(t => new { t.LanguageLevelID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.language",
                c => new
                    {
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        LanguageName = c.String(nullable: false, maxLength: 50),
                        Active = c.Boolean(),
                        LanguageCode = c.String(maxLength: 2),
                        CreatedDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 25),
                    })
                .PrimaryKey(t => new { t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.licensecertification",
                c => new
                    {
                        LicenseCertificationID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        LicenseCertificationType = c.String(nullable: false, maxLength: 100),
                        LicenseCertificationTypeDescription = c.String(maxLength: 4000),
                        LicenseCertificationAuthority = c.String(maxLength: 500),
                        VerificationWebsiteURL = c.String(maxLength: 2078),
                        HowToGetLicensedURL = c.String(maxLength: 2078),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.LicenseCertificationID, t.LanguageID });
            
            CreateTable(
                "dbo.messagetype",
                c => new
                    {
                        MessageTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        MessageTypeName = c.String(maxLength: 50),
                        MessageTypeDescription = c.String(maxLength: 200),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.MessageTypeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.OwnerStatusHistory",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        OwnerStatusChangedDate = c.DateTime(nullable: false),
                        OwnerStatusID = c.Int(nullable: false),
                        OwnerStatusChangedBy = c.String(nullable: false, maxLength: 3),
                    })
                .PrimaryKey(t => new { t.UserID, t.OwnerStatusChangedDate });
            
            CreateTable(
                "dbo.positionbackgroundcheck",
                c => new
                    {
                        PositionID = c.Int(nullable: false),
                        BackgroundCheckID = c.String(nullable: false, maxLength: 25),
                        StateProvinceID = c.String(nullable: false, maxLength: 25),
                        CountryID = c.String(nullable: false, maxLength: 25),
                        Required = c.Boolean(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.PositionID, t.BackgroundCheckID, t.StateProvinceID, t.CountryID });
            
            CreateTable(
                "dbo.positionratings",
                c => new
                    {
                        PositionID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        Rating1 = c.String(nullable: false, maxLength: 25),
                        Rating2 = c.String(nullable: false, maxLength: 25),
                        Rating3 = c.String(nullable: false, maxLength: 25),
                        Rating4 = c.String(maxLength: 25),
                        Rating1FormDescription = c.String(maxLength: 1000),
                        Rating2FormDescription = c.String(maxLength: 1000),
                        Rating3FormDescription = c.String(maxLength: 1000),
                        Rating4FormDescription = c.String(maxLength: 1000),
                        Rating1ProfileDescription = c.String(maxLength: 1000),
                        Rating2ProfileDescription = c.String(maxLength: 1000),
                        Rating3ProfileDescription = c.String(maxLength: 1000),
                        Rating4ProfileDescription = c.String(maxLength: 1000),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                    })
                .PrimaryKey(t => new { t.PositionID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.PricingGroups",
                c => new
                    {
                        PricingGroupID = c.Int(nullable: false),
                        InternalGroupName = c.String(nullable: false, maxLength: 50),
                        SelectionTitle = c.String(nullable: false, maxLength: 100),
                        SummaryTitle = c.String(nullable: false, maxLength: 100),
                        DynamicSummaryTitle = c.String(nullable: false, maxLength: 100),
                        LanguageID = c.Int(),
                        CountryID = c.Int(),
                    })
                .PrimaryKey(t => t.PricingGroupID);
            
            CreateTable(
                "dbo.pricingSummaryDetail",
                c => new
                    {
                        PricingSummaryID = c.Int(nullable: false),
                        PricingSummaryRevision = c.Int(nullable: false),
                        ServiceProfessionalServiceID = c.Int(nullable: false),
                        ServiceProfessionalDataInput = c.String(maxLength: 100),
                        ClientDataInput = c.String(maxLength: 500),
                        HourlyPrice = c.Decimal(precision: 5, scale: 2),
                        Price = c.Decimal(precision: 7, scale: 2),
                        ServiceDurationMinutes = c.Int(),
                        FirstSessionDurationMinutes = c.Int(),
                        ServiceName = c.String(nullable: false, maxLength: 50),
                        ServiceDescription = c.String(maxLength: 1000),
                        NumberOfSessions = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                    })
                .PrimaryKey(t => new { t.PricingSummaryID, t.PricingSummaryRevision, t.ServiceProfessionalServiceID });
            
            CreateTable(
                "dbo.PricingVariableDefinition",
                c => new
                    {
                        PricingVariableID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        PricingTypeID = c.Int(nullable: false),
                        InternalName = c.String(nullable: false, maxLength: 60),
                        IsProviderVariable = c.Boolean(nullable: false),
                        IsCustomerVariable = c.Boolean(nullable: false),
                        DataType = c.String(nullable: false, maxLength: 50),
                        VariableLabel = c.String(maxLength: 100),
                        VariableLabelPopUp = c.String(maxLength: 200),
                        VariableNameSingular = c.String(maxLength: 60),
                        VariableNamePlural = c.String(maxLength: 60),
                        NumberIncludedLabel = c.String(maxLength: 100),
                        NumberIncludedLabelPopUp = c.String(maxLength: 200),
                        HourlySurchargeLabel = c.String(maxLength: 100),
                        MinNumberAllowedLabel = c.String(maxLength: 100),
                        MinNumberAllowedLabelPopUp = c.String(maxLength: 200),
                        MaxNumberAllowedLabel = c.String(maxLength: 100),
                        MaxNumberAllowedLabelPopUp = c.String(maxLength: 200),
                        CalculateWithVariableID = c.Int(),
                        Active = c.Boolean(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        MinMaxValuesList = c.String(),
                    })
                .PrimaryKey(t => new { t.PricingVariableID, t.LanguageID, t.CountryID, t.PositionID, t.PricingTypeID });
            
            CreateTable(
                "dbo.PricingVariableValue",
                c => new
                    {
                        PricingVariableID = c.Int(nullable: false),
                        ProviderPackageID = c.Int(nullable: false),
                        UserID = c.Int(nullable: false),
                        PricingEstimateID = c.Int(nullable: false),
                        PricingEstimateRevision = c.Int(nullable: false),
                        Value = c.String(nullable: false, maxLength: 100),
                        ProviderNumberIncluded = c.Decimal(precision: 7, scale: 2),
                        ProviderMinNumberAllowed = c.Decimal(precision: 7, scale: 2),
                        ProviderMaxNumberAllowed = c.Decimal(precision: 7, scale: 2),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.PricingVariableID, t.ProviderPackageID, t.UserID, t.PricingEstimateID, t.PricingEstimateRevision });
            
            CreateTable(
                "dbo.providerpackagedetail",
                c => new
                    {
                        ProviderPackageID = c.Int(nullable: false),
                        ServiceAttributeID = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.ProviderPackageID, t.ServiceAttributeID });
            
            CreateTable(
                "dbo.providerpackage",
                c => new
                    {
                        ProviderPackageID = c.Int(nullable: false, identity: true),
                        PricingTypeID = c.Int(nullable: false),
                        ProviderUserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        ProviderPackageName = c.String(nullable: false, maxLength: 50),
                        ProviderPackageDescription = c.String(maxLength: 1000),
                        ProviderPackagePrice = c.Decimal(precision: 7, scale: 2),
                        ProviderPackageServiceDuration = c.Int(nullable: false),
                        FirstTimeClientsOnly = c.Boolean(nullable: false),
                        NumberOfSessions = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        IsAddOn = c.Boolean(nullable: false),
                        PriceRate = c.Decimal(precision: 7, scale: 2),
                        PriceRateUnit = c.String(maxLength: 30),
                        IsPhone = c.Boolean(nullable: false),
                        VisibleToClientID = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.ProviderPackageID);
            
            CreateTable(
                "dbo.ProviderPaymentAccount",
                c => new
                    {
                        ProviderUserID = c.Int(nullable: false),
                        MerchantAccountID = c.String(nullable: false, maxLength: 100),
                        Status = c.String(nullable: false, maxLength: 50),
                        Message = c.String(maxLength: 400),
                        bt_signature = c.String(),
                        bt_payload = c.String(),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                    })
                .PrimaryKey(t => t.ProviderUserID);
            
            CreateTable(
                "dbo.providerpaymentpreference",
                c => new
                    {
                        ProviderUserID = c.Int(nullable: false),
                        ProviderPaymentPreferenceTypeID = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        Modifiedby = c.String(nullable: false, maxLength: 25),
                        Verified = c.Boolean(nullable: false),
                        AccountName = c.String(maxLength: 100),
                        ABANumber = c.Decimal(precision: 9, scale: 0),
                        LastThreeAccountDigits = c.String(maxLength: 64),
                    })
                .PrimaryKey(t => t.ProviderUserID);
            
            CreateTable(
                "dbo.providerpaymentpreferencetype",
                c => new
                    {
                        ProviderPaymentPreferenceTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        ProviderPaymentPreferenceTypeName = c.String(nullable: false, maxLength: 50),
                        ProviderPaymentPreferenceTypeDescription = c.String(maxLength: 300),
                        DependsOnID = c.Int(),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.ProviderPaymentPreferenceTypeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.providerservicephoto",
                c => new
                    {
                        ProviderServicePhotoID = c.Int(nullable: false, identity: true),
                        UserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        PhotoCaption = c.String(maxLength: 50),
                        PhotoAddress = c.String(nullable: false, maxLength: 2073),
                        RankPosition = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        IsPrimaryPhoto = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.ProviderServicePhotoID);
            
            CreateTable(
                "dbo.providertaxform",
                c => new
                    {
                        ProviderUserID = c.Int(nullable: false),
                        FullName = c.String(nullable: false, maxLength: 200),
                        BusinessName = c.String(maxLength: 200),
                        StreetApt = c.String(nullable: false, maxLength: 100),
                        City = c.String(nullable: false, maxLength: 100),
                        PostalCodeID = c.Int(),
                        StateProvinceID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        TaxEntityTypeID = c.Int(nullable: false),
                        ExemptPayee = c.Boolean(nullable: false),
                        TINTypeID = c.String(nullable: false, maxLength: 25),
                        Signature = c.String(nullable: false, maxLength: 200),
                        UserIPAddress = c.String(nullable: false, maxLength: 500),
                        DateTimeSubmitted = c.DateTime(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        LastThreeTINDigits = c.String(maxLength: 64),
                    })
                .PrimaryKey(t => t.ProviderUserID);
            
            CreateTable(
                "dbo.serviceattributecategory",
                c => new
                    {
                        ServiceAttributeCategoryID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        ServiceAttributeCategory = c.String(maxLength: 200),
                        CreateDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 20),
                        Active = c.Boolean(),
                        SourceID = c.Int(),
                        PricingOptionCategory = c.Boolean(),
                        ServiceAttributeCategoryDescription = c.String(maxLength: 500),
                        RequiredInput = c.Boolean(nullable: false),
                        SideBarCategory = c.Boolean(nullable: false),
                        EligibleForPackages = c.Boolean(nullable: false),
                        DisplayRank = c.Int(nullable: false),
                        PositionReference = c.Int(),
                        BookingPathSelection = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.ServiceAttributeCategoryID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.ServiceAttributeExperienceLevel",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        ExperienceLevelID = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                    })
                .PrimaryKey(t => new { t.UserID, t.PositionID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.ServiceAttributeLanguageLevel",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        ServiceAttributeID = c.Int(nullable: false),
                        LanguageLevelID = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                    })
                .PrimaryKey(t => new { t.UserID, t.PositionID, t.LanguageID, t.CountryID, t.ServiceAttributeID });
            
            CreateTable(
                "dbo.serviceattribute",
                c => new
                    {
                        ServiceAttributeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        SourceID = c.Int(),
                        Name = c.String(maxLength: 100),
                        ServiceAttributeDescription = c.String(maxLength: 2000),
                        CreateDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 45),
                        Active = c.Boolean(),
                        DisplayRank = c.Int(nullable: false),
                        PositionReference = c.Int(),
                        EnteredByUserID = c.Int(),
                        Approved = c.Boolean(),
                    })
                .PrimaryKey(t => new { t.ServiceAttributeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.servicecategory",
                c => new
                    {
                        ServiceCategoryID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        Name = c.String(maxLength: 45),
                        Description = c.String(maxLength: 350),
                        CreatedDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 2),
                        Active = c.Boolean(),
                        ImagePath = c.String(maxLength: 200),
                        headline = c.String(maxLength: 250),
                    })
                .PrimaryKey(t => new { t.ServiceCategoryID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.servicesubcategory",
                c => new
                    {
                        ServiceSubCategoryID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        Name = c.String(maxLength: 45),
                        Description = c.String(maxLength: 250),
                        CreatedDate = c.DateTime(),
                        UpdatedDate = c.DateTime(),
                        ModifiedBy = c.String(maxLength: 2),
                        Active = c.Boolean(),
                        ServiceCategoryID = c.Int(),
                        Rank = c.Int(),
                        RankQuery = c.String(maxLength: 200),
                    })
                .PrimaryKey(t => new { t.ServiceSubCategoryID, t.LanguageID, t.CountryID })
                .ForeignKey("dbo.servicecategory", t => new { t.ServiceCategoryID, t.LanguageID, t.CountryID })
                .Index(t => new { t.LanguageID, t.CountryID, t.ServiceCategoryID });
            
            CreateTable(
                "dbo.servicecategorypositionattribute",
                c => new
                    {
                        PositionID = c.Int(nullable: false),
                        ServiceAttributeCategoryID = c.Int(nullable: false),
                        ServiceAttributeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        CreateDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 20),
                        Active = c.Boolean(nullable: false),
                        EnteredByUserID = c.Int(),
                        Approved = c.Boolean(),
                    })
                .PrimaryKey(t => new { t.PositionID, t.ServiceAttributeCategoryID, t.ServiceAttributeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.servicecategoryposition",
                c => new
                    {
                        ServiceCategoryID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        Rank = c.Int(nullable: false),
                        CreateDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.ServiceCategoryID, t.PositionID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.taxentitytype",
                c => new
                    {
                        TaxEntityTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        TaxEntityTypeName = c.String(maxLength: 75),
                        TaxEntityTypeDescription = c.String(maxLength: 300),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.TaxEntityTypeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.tintype",
                c => new
                    {
                        TINTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        TINTypeAbbr = c.String(nullable: false, maxLength: 10),
                        TINTypeName = c.String(nullable: false, maxLength: 70),
                        TINTypeDescription = c.String(maxLength: 200),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.TINTypeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.transporttype",
                c => new
                    {
                        TransportTypeID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        TransportTypeName = c.String(nullable: false, maxLength: 50),
                        TransportTypeDescription = c.String(maxLength: 300),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.TransportTypeID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.UserAlert",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        AlertID = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        CompletedDate = c.DateTime(),
                        Active = c.Boolean(nullable: false),
                        AlertQuery = c.String(maxLength: 1000),
                        Dismissed = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.UserID, t.PositionID, t.AlertID });
            
            CreateTable(
                "dbo.UserFeePayments",
                c => new
                    {
                        UserFeePaymentID = c.Int(nullable: false, identity: true),
                        UserID = c.Int(nullable: false),
                        PaymentTransactionID = c.String(nullable: false, maxLength: 250),
                        SubscriptionID = c.String(nullable: false, maxLength: 250),
                        PaymentDate = c.DateTimeOffset(nullable: false, precision: 0),
                        PaymentAmount = c.Decimal(nullable: false, storeType: "money"),
                        PaymentPlan = c.String(nullable: false, maxLength: 25),
                        PaymentMethod = c.String(nullable: false, maxLength: 50),
                        PaymentStatus = c.String(nullable: false, maxLength: 50),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 0),
                        ModifiedDate = c.DateTimeOffset(nullable: false, precision: 0),
                    })
                .PrimaryKey(t => t.UserFeePaymentID);
            
            CreateTable(
                "dbo.UserPaymentPlan",
                c => new
                    {
                        UserPaymentPlanID = c.Int(nullable: false, identity: true),
                        UserID = c.Int(nullable: false),
                        SubscriptionID = c.String(nullable: false, maxLength: 250),
                        PaymentPlan = c.String(nullable: false, maxLength: 25),
                        PaymentMethod = c.String(nullable: false, maxLength: 50),
                        PaymentPlanLastChangedDate = c.DateTimeOffset(nullable: false, precision: 0),
                        NextPaymentDueDate = c.DateTimeOffset(precision: 0),
                        NextPaymentAmount = c.Decimal(storeType: "money"),
                        FirstBillingDate = c.DateTimeOffset(nullable: false, precision: 0),
                        SubscriptionEndDate = c.DateTimeOffset(precision: 0),
                        PaymentMethodToken = c.String(nullable: false, maxLength: 250),
                        PaymentExpiryDate = c.DateTimeOffset(precision: 0),
                        PlanStatus = c.String(nullable: false, maxLength: 50),
                        DaysPastDue = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.UserPaymentPlanID);
            
            CreateTable(
                "dbo.userprofile",
                c => new
                    {
                        UserId = c.Int(nullable: false, identity: true),
                        Email = c.String(nullable: false, maxLength: 254),
                    })
                .PrimaryKey(t => t.UserId);
            
            CreateTable(
                "dbo.webpages_Roles",
                c => new
                    {
                        RoleId = c.Int(nullable: false, identity: true),
                        RoleName = c.String(nullable: false, maxLength: 256),
                    })
                .PrimaryKey(t => t.RoleId);
            
            CreateTable(
                "dbo.UserReviews",
                c => new
                    {
                        BookingID = c.Int(nullable: false),
                        CustomerUserID = c.Int(nullable: false),
                        ProviderUserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        PrivateReview = c.String(maxLength: 1000),
                        PublicReview = c.String(maxLength: 500),
                        Rating1 = c.Byte(),
                        Rating2 = c.Byte(),
                        Rating3 = c.Byte(),
                        Rating4 = c.Byte(),
                        Answer1 = c.Boolean(),
                        Answer2 = c.Boolean(),
                        Answer1Comment = c.String(maxLength: 1000),
                        Answer2Comment = c.String(maxLength: 1000),
                        ServiceHours = c.Decimal(precision: 18, scale: 5),
                        HelpfulReviewCount = c.Long(),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 50),
                    })
                .PrimaryKey(t => new { t.BookingID, t.CustomerUserID, t.ProviderUserID, t.PositionID });
            
            CreateTable(
                "dbo.UserReviewScores",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        TotalRatings = c.Long(),
                        Rating1 = c.Decimal(precision: 18, scale: 2),
                        Rating2 = c.Decimal(precision: 18, scale: 2),
                        Rating3 = c.Decimal(precision: 18, scale: 2),
                        Rating4 = c.Decimal(precision: 18, scale: 2),
                        Answer1 = c.Long(),
                        Answer2 = c.Long(),
                        ServiceHours = c.Decimal(precision: 18, scale: 2),
                        LastRatingDate = c.DateTime(),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 50),
                    })
                .PrimaryKey(t => new { t.UserID, t.PositionID });
            
            CreateTable(
                "dbo.usersignup",
                c => new
                    {
                        UserId = c.Int(nullable: false, identity: true),
                        Email = c.String(nullable: false, maxLength: 56),
                    })
                .PrimaryKey(t => t.UserId);
            
            CreateTable(
                "dbo.userverification",
                c => new
                    {
                        UserID = c.Int(nullable: false),
                        VerificationID = c.Int(nullable: false),
                        PositionID = c.Int(nullable: false),
                        DateVerified = c.DateTime(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        VerifiedBy = c.String(nullable: false, maxLength: 25),
                        LastVerifiedDate = c.DateTime(nullable: false),
                        Active = c.Boolean(nullable: false),
                        VerificationStatusID = c.Int(nullable: false),
                        Comments = c.String(maxLength: 2000),
                    })
                .PrimaryKey(t => new { t.UserID, t.VerificationID, t.PositionID });
            
            CreateTable(
                "dbo.verificationcategory",
                c => new
                    {
                        VerificationCategoryID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        VerificationCategoryName = c.String(nullable: false, maxLength: 100),
                        VerificationCategoryDescription = c.String(maxLength: 1000),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        RankPosition = c.Int(),
                    })
                .PrimaryKey(t => new { t.VerificationCategoryID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.verification",
                c => new
                    {
                        VerificationID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        VerificationType = c.String(nullable: false, maxLength: 100),
                        VerificationDescription = c.String(nullable: false, maxLength: 1000),
                        VerificationProcess = c.String(maxLength: 500),
                        Icon = c.String(maxLength: 15),
                        CreatedDate = c.DateTime(nullable: false),
                        ModifiedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(maxLength: 25),
                        Active = c.Boolean(nullable: false),
                        VerificationCategoryID = c.Int(nullable: false),
                        RankPosition = c.Int(),
                        SummaryGroup = c.String(maxLength: 20),
                    })
                .PrimaryKey(t => new { t.VerificationID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.verificationstatus",
                c => new
                    {
                        VerificationStatusID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        VerificationStatusName = c.String(nullable: false, maxLength: 50),
                        VerificationStatusDisplayDescription = c.String(maxLength: 300),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 25),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.VerificationStatusID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.VOCElement",
                c => new
                    {
                        VOCElementID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        VOCElementName = c.String(maxLength: 100),
                        ScoreStartValue = c.Int(),
                        ScoreMidValue = c.Int(),
                        ScoreEndValue = c.Int(),
                        ScoreStartLabel = c.String(maxLength: 25),
                        ScoreMidLabel = c.String(maxLength: 25),
                        ScoreEndLabel = c.String(maxLength: 25),
                        CreateDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 3),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.VOCElementID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.VOCExperienceCategory",
                c => new
                    {
                        VOCExperienceCategoryID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        VOCExperienceCategoryName = c.String(maxLength: 50),
                        VOCExperienceCategoryDescription = c.String(maxLength: 200),
                        CreateDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 3),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.VOCExperienceCategoryID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.VOCFeedback",
                c => new
                    {
                        VOCFeedbackID = c.Int(nullable: false, identity: true),
                        VOCElementID = c.Int(nullable: false),
                        VOCExperienceCategoryID = c.Int(nullable: false),
                        UserID = c.Int(nullable: false),
                        Feedback = c.String(nullable: false),
                        VOCFlag1 = c.String(maxLength: 50),
                        VOCFlag2 = c.String(maxLength: 50),
                        VOCFlag3 = c.String(maxLength: 50),
                        VOCFlag4 = c.String(maxLength: 50),
                        UserDevice = c.String(),
                        ZenDeskTicketNumber = c.Int(),
                        ProviderUserID = c.Int(),
                        ProviderPositionID = c.Int(),
                        CreatedDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 3),
                    })
                .PrimaryKey(t => t.VOCFeedbackID);
            
            CreateTable(
                "dbo.VOCFlag",
                c => new
                    {
                        VOCFlagID = c.Int(nullable: false),
                        LanguageID = c.Int(nullable: false),
                        CountryID = c.Int(nullable: false),
                        VOCFlagName = c.String(nullable: false, maxLength: 50),
                        VOCFlagNDescription = c.String(maxLength: 500),
                        CreateDate = c.DateTime(nullable: false),
                        UpdatedDate = c.DateTime(nullable: false),
                        ModifiedBy = c.String(nullable: false, maxLength: 3),
                        Active = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => new { t.VOCFlagID, t.LanguageID, t.CountryID });
            
            CreateTable(
                "dbo.VOCScores",
                c => new
                    {
                        VOCScoresID = c.Int(nullable: false),
                        UserID = c.Int(nullable: false),
                        VOCElementID = c.Int(nullable: false),
                        Score = c.Int(nullable: false),
                        Date = c.DateTime(nullable: false),
                        ProviderUserID = c.Int(),
                        ProviderPositionID = c.Int(),
                        UserDevice = c.String(maxLength: 100),
                        VOCExperienceCategoryID = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.VOCScoresID, t.UserID, t.VOCElementID, t.Score, t.Date });
            
            CreateTable(
                "dbo.webpages_FacebookCredentials",
                c => new
                    {
                        UserId = c.Int(nullable: false),
                        FacebookId = c.Long(nullable: false),
                    })
                .PrimaryKey(t => new { t.UserId, t.FacebookId });
            
            CreateTable(
                "dbo.webpages_Membership",
                c => new
                    {
                        UserId = c.Int(nullable: false),
                        CreateDate = c.DateTime(),
                        ConfirmationToken = c.String(maxLength: 128),
                        IsConfirmed = c.Boolean(),
                        LastPasswordFailureDate = c.DateTime(),
                        PasswordFailuresSinceLastSuccess = c.Int(nullable: false),
                        Password = c.String(nullable: false, maxLength: 128),
                        PasswordChangedDate = c.DateTime(),
                        PasswordSalt = c.String(nullable: false, maxLength: 128),
                        PasswordVerificationToken = c.String(maxLength: 128),
                        PasswordVerificationTokenExpirationDate = c.DateTime(),
                    })
                .PrimaryKey(t => t.UserId);
            
            CreateTable(
                "dbo.webpages_OAuthMembership",
                c => new
                    {
                        Provider = c.String(nullable: false, maxLength: 30),
                        ProviderUserId = c.String(nullable: false, maxLength: 100),
                        UserId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.Provider, t.ProviderUserId });
            
            CreateTable(
                "dbo.webpages_UsersInRoles",
                c => new
                    {
                        RoleId = c.Int(nullable: false),
                        UserId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.RoleId, t.UserId })
                .ForeignKey("dbo.webpages_Roles", t => t.RoleId, cascadeDelete: true)
                .ForeignKey("dbo.userprofile", t => t.UserId, cascadeDelete: true)
                .Index(t => t.RoleId)
                .Index(t => t.UserId);
            #endregion
            

            // insert data
            if (countryIds.Length > 0 && languageIds.Length > 0)
            {
                if (insertDataSQL)
                {
                    var baseDir = String.Format("{0}\\setup", AppDomain.CurrentDomain.GetData("DataDirectory"));

                    var dbDataPath = String.Format("\\country-{0}\\language-{1}",
                        String.Join("-", countryIds),
                        String.Join("-", languageIds)); // eg: \\setup\\country-1-2\\language-1-2
                    var dbStoredProcPath = "\\storedprocs";

                    
                    if (Directory.Exists(baseDir + dbDataPath) && Directory.Exists(baseDir + dbStoredProcPath))
                    {
                        Sql(File.ReadAllText(baseDir + dbDataPath + "\\data-insert.sql"));
                        Sql(File.ReadAllText(baseDir + dbDataPath + "\\data-insert-postcodes.sql")); // out of memory exception means this needs to be a seperate file
                        Sql(File.ReadAllText(baseDir + dbStoredProcPath + "\\all.sql"));
                    }
                }
                if (insertDataCSV)
                {

                }
            }
        }

        public override void Down()
        {
            DropForeignKey("dbo.webpages_UsersInRoles", "UserId", "dbo.userprofile");
            DropForeignKey("dbo.webpages_UsersInRoles", "RoleId", "dbo.webpages_Roles");
            DropForeignKey("dbo.servicesubcategory", new[] { "LanguageID", "CountryID", "ServiceCategoryID" }, "dbo.servicecategory");
            DropForeignKey("dbo.users", "AccountStatusID", "dbo.accountstatus");
            DropForeignKey("dbo.userprofilepositions", "StatusID", "dbo.accountstatus");
            DropForeignKey("dbo.userprofileserviceattributes", new[] { "UserID", "PositionID", "LanguageID", "CountryID" }, "dbo.userprofilepositions");
            DropForeignKey("dbo.userprofilepositions", new[] { "PositionID", "LanguageID", "CountryID" }, "dbo.positions");
            DropForeignKey("dbo.positionpricingtype", new[] { "PositionID", "LanguageID", "CountryID" }, "dbo.positions");
            DropForeignKey("dbo.positionpricingtype", new[] { "PricingTypeID", "LanguageID", "CountryID" }, "dbo.pricingtype");
            DropForeignKey("dbo.positionpricingtype", new[] { "ClientTypeID", "LanguageID", "CountryID" }, "dbo.clienttype");
            DropForeignKey("dbo.booking", new[] { "JobTitleID", "LanguageID", "CountryID" }, "dbo.positions");
            DropForeignKey("dbo.ServiceProfessionalClient", "CreatedByBookingID", "dbo.booking");
            DropForeignKey("dbo.UserStats", "UserID", "dbo.users");
            DropForeignKey("dbo.userprofilepositions", "UserID", "dbo.users");
            DropForeignKey("dbo.UserLicenseCertifications", "ProviderUserID", "dbo.users");
            DropForeignKey("dbo.usereducation", "UserID", "dbo.users");
            DropForeignKey("dbo.usereducation", "InstitutionID", "dbo.institution");
            DropForeignKey("dbo.postalcode", "StateProvinceID", "dbo.stateprovince");
            DropForeignKey("dbo.institution", "StateProvinceID", "dbo.stateprovince");
            DropForeignKey("dbo.county", "StateProvinceID", "dbo.stateprovince");
            DropForeignKey("dbo.postalcode", "CountyID", "dbo.county");
            DropForeignKey("dbo.municipality", "CountyID", "dbo.county");
            DropForeignKey("dbo.postalcode", "MunicipalityID", "dbo.municipality");
            DropForeignKey("dbo.userbackgroundcheck", "UserID", "dbo.users");
            DropForeignKey("dbo.ServiceProfessionalClient", "ClientUserID", "dbo.users");
            DropForeignKey("dbo.ServiceProfessionalClient", "ServiceProfessionalUserID", "dbo.users");
            DropForeignKey("dbo.serviceaddress", "UserID", "dbo.users");
            DropForeignKey("dbo.users", "OwnerStatusID", "dbo.OwnerStatus");
            DropForeignKey("dbo.OwnerAcknowledgment", "UserID", "dbo.users");
            DropForeignKey("dbo.MessagingThreads", "ProviderUserID", "dbo.users");
            DropForeignKey("dbo.MessagingThreads", "CustomerUserID", "dbo.users");
            DropForeignKey("dbo.MessagingThreads", "MessageThreadStatusID", "dbo.messagethreadstatus");
            DropForeignKey("dbo.MessagingThreads", "LastMessageID", "dbo.Messages");
            DropForeignKey("dbo.CalendarProviderAttributes", "UserID", "dbo.users");
            DropForeignKey("dbo.booking", "ServiceProfessionalUserID", "dbo.users");
            DropForeignKey("dbo.booking", "ClientUserID", "dbo.users");
            DropForeignKey("dbo.booking", "AwaitingResponseFromUserID", "dbo.users");
            DropForeignKey("dbo.ServiceProfessionalClient", "ReferralSourceID", "dbo.ReferralSource");
            DropForeignKey("dbo.booking", new[] { "PricingSummaryID", "PricingSummaryRevision" }, "dbo.pricingSummary");
            DropForeignKey("dbo.booking", new[] { "CancellationPolicyID", "LanguageID", "CountryID" }, "dbo.cancellationpolicy");
            DropForeignKey("dbo.CalendarReccurrence", "EventID", "dbo.CalendarEvents");
            DropForeignKey("dbo.CalendarReccurrence", "Frequency", "dbo.CalendarRecurrenceFrequencyTypes");
            DropForeignKey("dbo.CalendarReccurrenceFrequency", "CalendarReccursiveID", "dbo.CalendarReccurrence");
            DropForeignKey("dbo.CalendarEvents", "EventType", "dbo.CalendarEventType");
            DropForeignKey("dbo.CalendarEventsContacts", "IdEvent", "dbo.CalendarEvents");
            DropForeignKey("dbo.CalendarEventsAttendees", "IdEvent", "dbo.CalendarEvents");
            DropForeignKey("dbo.CalendarEventRecurrencesPeriodList", "IdEvent", "dbo.CalendarEvents");
            DropForeignKey("dbo.CalendarEventRecurrencesPeriod", "IdRecurrence", "dbo.CalendarEventRecurrencesPeriodList");
            DropForeignKey("dbo.CalendarEventExceptionsPeriodsList", "IdEvent", "dbo.CalendarEvents");
            DropForeignKey("dbo.CalendarEventExceptionsPeriod", "IdException", "dbo.CalendarEventExceptionsPeriodsList");
            DropForeignKey("dbo.CalendarEventComments", "IdEvent", "dbo.CalendarEvents");
            DropForeignKey("dbo.CalendarEvents", "CalendarAvailabilityTypeID", "dbo.CalendarAvailabilityType");
            DropForeignKey("dbo.booking", "ServiceDateID", "dbo.CalendarEvents");
            DropForeignKey("dbo.booking", "AlternativeDate2ID", "dbo.CalendarEvents");
            DropForeignKey("dbo.booking", "AlternativeDate1ID", "dbo.CalendarEvents");
            DropForeignKey("dbo.booking", "BookingTypeID", "dbo.bookingType");
            DropForeignKey("dbo.booking", "BookingStatusID", "dbo.bookingStatus");
            DropForeignKey("dbo.booking", "ParentBookingID", "dbo.booking");
            DropForeignKey("dbo.booking", "ServiceAddressID", "dbo.address");
            DropIndex("dbo.webpages_UsersInRoles", new[] { "UserId" });
            DropIndex("dbo.webpages_UsersInRoles", new[] { "RoleId" });
            DropIndex("dbo.servicesubcategory", new[] { "LanguageID", "CountryID", "ServiceCategoryID" });
            DropIndex("dbo.userprofileserviceattributes", new[] { "UserID", "PositionID", "LanguageID", "CountryID" });
            DropIndex("dbo.positionpricingtype", new[] { "ClientTypeID", "LanguageID", "CountryID" });
            DropIndex("dbo.positionpricingtype", new[] { "PricingTypeID", "LanguageID", "CountryID" });
            DropIndex("dbo.positionpricingtype", new[] { "PositionID", "LanguageID", "CountryID" });
            DropIndex("dbo.UserStats", new[] { "UserID" });
            DropIndex("dbo.UserLicenseCertifications", new[] { "ProviderUserID" });
            DropIndex("dbo.postalcode", new[] { "CountyID" });
            DropIndex("dbo.postalcode", new[] { "MunicipalityID" });
            DropIndex("dbo.postalcode", new[] { "StateProvinceID" });
            DropIndex("dbo.municipality", new[] { "CountyID" });
            DropIndex("dbo.county", new[] { "StateProvinceID" });
            DropIndex("dbo.institution", new[] { "StateProvinceID" });
            DropIndex("dbo.usereducation", new[] { "InstitutionID" });
            DropIndex("dbo.usereducation", new[] { "UserID" });
            DropIndex("dbo.userbackgroundcheck", new[] { "UserID" });
            DropIndex("dbo.serviceaddress", new[] { "UserID" });
            DropIndex("dbo.OwnerAcknowledgment", new[] { "UserID" });
            DropIndex("dbo.MessagingThreads", new[] { "LastMessageID" });
            DropIndex("dbo.MessagingThreads", new[] { "MessageThreadStatusID" });
            DropIndex("dbo.MessagingThreads", new[] { "ProviderUserID" });
            DropIndex("dbo.MessagingThreads", new[] { "CustomerUserID" });
            DropIndex("dbo.CalendarProviderAttributes", new[] { "UserID" });
            DropIndex("dbo.users", new[] { "OwnerStatusID" });
            DropIndex("dbo.users", new[] { "AccountStatusID" });
            DropIndex("dbo.ServiceProfessionalClient", new[] { "CreatedByBookingID" });
            DropIndex("dbo.ServiceProfessionalClient", new[] { "ReferralSourceID" });
            DropIndex("dbo.ServiceProfessionalClient", new[] { "ClientUserID" });
            DropIndex("dbo.ServiceProfessionalClient", new[] { "ServiceProfessionalUserID" });
            DropIndex("dbo.CalendarReccurrenceFrequency", new[] { "CalendarReccursiveID" });
            DropIndex("dbo.CalendarReccurrence", new[] { "Frequency" });
            DropIndex("dbo.CalendarReccurrence", new[] { "EventID" });
            DropIndex("dbo.CalendarEventsContacts", new[] { "IdEvent" });
            DropIndex("dbo.CalendarEventsAttendees", new[] { "IdEvent" });
            DropIndex("dbo.CalendarEventRecurrencesPeriod", new[] { "IdRecurrence" });
            DropIndex("dbo.CalendarEventRecurrencesPeriodList", new[] { "IdEvent" });
            DropIndex("dbo.CalendarEventExceptionsPeriod", new[] { "IdException" });
            DropIndex("dbo.CalendarEventExceptionsPeriodsList", new[] { "IdEvent" });
            DropIndex("dbo.CalendarEventComments", new[] { "IdEvent" });
            DropIndex("dbo.CalendarEvents", new[] { "CalendarAvailabilityTypeID" });
            DropIndex("dbo.CalendarEvents", new[] { "EventType" });
            DropIndex("dbo.booking", new[] { "AwaitingResponseFromUserID" });
            DropIndex("dbo.booking", new[] { "PricingSummaryID", "PricingSummaryRevision" });
            DropIndex("dbo.booking", new[] { "AlternativeDate2ID" });
            DropIndex("dbo.booking", new[] { "AlternativeDate1ID" });
            DropIndex("dbo.booking", new[] { "ServiceDateID" });
            DropIndex("dbo.booking", new[] { "ServiceAddressID" });
            DropIndex("dbo.booking", new[] { "ParentBookingID" });
            DropIndex("dbo.booking", new[] { "BookingTypeID" });
            DropIndex("dbo.booking", new[] { "BookingStatusID" });
            DropIndex("dbo.booking", new[] { "CancellationPolicyID", "LanguageID", "CountryID" });
            DropIndex("dbo.booking", new[] { "JobTitleID", "LanguageID", "CountryID" });
            DropIndex("dbo.booking", new[] { "ServiceProfessionalUserID" });
            DropIndex("dbo.booking", new[] { "ClientUserID" });
            DropIndex("dbo.userprofilepositions", new[] { "StatusID" });
            DropIndex("dbo.userprofilepositions", new[] { "PositionID", "LanguageID", "CountryID" });
            DropIndex("dbo.userprofilepositions", new[] { "UserID" });
            DropTable("dbo.webpages_UsersInRoles");
            DropTable("dbo.webpages_OAuthMembership");
            DropTable("dbo.webpages_Membership");
            DropTable("dbo.webpages_FacebookCredentials");
            DropTable("dbo.VOCScores");
            DropTable("dbo.VOCFlag");
            DropTable("dbo.VOCFeedback");
            DropTable("dbo.VOCExperienceCategory");
            DropTable("dbo.VOCElement");
            DropTable("dbo.verificationstatus");
            DropTable("dbo.verification");
            DropTable("dbo.verificationcategory");
            DropTable("dbo.userverification");
            DropTable("dbo.usersignup");
            DropTable("dbo.UserReviewScores");
            DropTable("dbo.UserReviews");
            DropTable("dbo.webpages_Roles");
            DropTable("dbo.userprofile");
            DropTable("dbo.UserPaymentPlan");
            DropTable("dbo.UserFeePayments");
            DropTable("dbo.UserAlert");
            DropTable("dbo.transporttype");
            DropTable("dbo.tintype");
            DropTable("dbo.taxentitytype");
            DropTable("dbo.servicecategoryposition");
            DropTable("dbo.servicecategorypositionattribute");
            DropTable("dbo.servicesubcategory");
            DropTable("dbo.servicecategory");
            DropTable("dbo.serviceattribute");
            DropTable("dbo.ServiceAttributeLanguageLevel");
            DropTable("dbo.ServiceAttributeExperienceLevel");
            DropTable("dbo.serviceattributecategory");
            DropTable("dbo.providertaxform");
            DropTable("dbo.providerservicephoto");
            DropTable("dbo.providerpaymentpreferencetype");
            DropTable("dbo.providerpaymentpreference");
            DropTable("dbo.ProviderPaymentAccount");
            DropTable("dbo.providerpackage");
            DropTable("dbo.providerpackagedetail");
            DropTable("dbo.PricingVariableValue");
            DropTable("dbo.PricingVariableDefinition");
            DropTable("dbo.pricingSummaryDetail");
            DropTable("dbo.PricingGroups");
            DropTable("dbo.positionratings");
            DropTable("dbo.positionbackgroundcheck");
            DropTable("dbo.OwnerStatusHistory");
            DropTable("dbo.messagetype");
            DropTable("dbo.licensecertification");
            DropTable("dbo.language");
            DropTable("dbo.languagelevel");
            DropTable("dbo.jobTitleLicense");
            DropTable("dbo.Gender");
            DropTable("dbo.ExperienceLevel");
            DropTable("dbo.country");
            DropTable("dbo.backgroundcheck");
            DropTable("dbo.alerttype");
            DropTable("dbo.alert");
            DropTable("dbo.addresstype");
            DropTable("dbo.userprofileserviceattributes");
            DropTable("dbo.pricingtype");
            DropTable("dbo.clienttype");
            DropTable("dbo.positionpricingtype");
            DropTable("dbo.UserStats");
            DropTable("dbo.UserLicenseCertifications");
            DropTable("dbo.postalcode");
            DropTable("dbo.municipality");
            DropTable("dbo.county");
            DropTable("dbo.stateprovince");
            DropTable("dbo.institution");
            DropTable("dbo.usereducation");
            DropTable("dbo.userbackgroundcheck");
            DropTable("dbo.serviceaddress");
            DropTable("dbo.OwnerStatus");
            DropTable("dbo.OwnerAcknowledgment");
            DropTable("dbo.messagethreadstatus");
            DropTable("dbo.Messages");
            DropTable("dbo.MessagingThreads");
            DropTable("dbo.CalendarProviderAttributes");
            DropTable("dbo.users");
            DropTable("dbo.ReferralSource");
            DropTable("dbo.ServiceProfessionalClient");
            DropTable("dbo.pricingSummary");
            DropTable("dbo.cancellationpolicy");
            DropTable("dbo.CalendarRecurrenceFrequencyTypes");
            DropTable("dbo.CalendarReccurrenceFrequency");
            DropTable("dbo.CalendarReccurrence");
            DropTable("dbo.CalendarEventType");
            DropTable("dbo.CalendarEventsContacts");
            DropTable("dbo.CalendarEventsAttendees");
            DropTable("dbo.CalendarEventRecurrencesPeriod");
            DropTable("dbo.CalendarEventRecurrencesPeriodList");
            DropTable("dbo.CalendarEventExceptionsPeriod");
            DropTable("dbo.CalendarEventExceptionsPeriodsList");
            DropTable("dbo.CalendarEventComments");
            DropTable("dbo.CalendarAvailabilityType");
            DropTable("dbo.CalendarEvents");
            DropTable("dbo.bookingType");
            DropTable("dbo.bookingStatus");
            DropTable("dbo.address");
            DropTable("dbo.booking");
            DropTable("dbo.positions");
            DropTable("dbo.userprofilepositions");
            DropTable("dbo.accountstatus");
            DropStoredProcedure("CheckUserEmail");
            DropStoredProcedure("CreateCustomer");
            DropStoredProcedure("CreateProviderFromUser");
            DropStoredProcedure("DeleteBookingRequest");
            DropStoredProcedure("DeleteUser");
            DropStoredProcedure("DeleteUserPosition");
            DropStoredProcedure("DelUserVerification");
            DropStoredProcedure("GetPosition");
            DropStoredProcedure("GetSearchResults");
            DropStoredProcedure("GetServiceAttributeCategories");
            DropStoredProcedure("GetServiceAttributes");
            DropStoredProcedure("GetUserCalendarProviderAttributes");
            DropStoredProcedure("GetUserDetails");
            DropStoredProcedure("GetUserProfile");
            DropStoredProcedure("InsertUserProfilePositions");
            DropStoredProcedure("ListPositions");
            DropStoredProcedure("SearchCategories");
            DropStoredProcedure("SearchCategoriesPositions");
            DropStoredProcedure("SearchPositions");
            DropStoredProcedure("SearchPositionsByCategory");
            DropStoredProcedure("SearchProvidersByPositionSingular");
            DropStoredProcedure("SearchTopProvidersByPosition");
            DropStoredProcedure("SetCalendarProviderAttributes");
            DropStoredProcedure("SetHomeAddress");
            DropStoredProcedure("SetUserAlert");
            DropStoredProcedure("SetUserVerification");
            DropStoredProcedure("sp_MSforeachtable");
            DropStoredProcedure("TestAlertAvailability");
            DropStoredProcedure("TestAlertBackgroundCheck");
            DropStoredProcedure("TestAlertBasicInfoVerification");
            DropStoredProcedure("TestAlertEducation");
            DropStoredProcedure("TestAlertLocation");
            DropStoredProcedure("TestAlertPayment");
            DropStoredProcedure("TestAlertPersonalInfo");
            DropStoredProcedure("TestAlertPhoto");
            DropStoredProcedure("TestAlertPositionServices");
            DropStoredProcedure("TestAlertPricingDetails");
            DropStoredProcedure("TestAlertProfessionalLicense");
            DropStoredProcedure("TestAlertPublicBio");
            DropStoredProcedure("TestAlertReferenceRequests");
            DropStoredProcedure("TestAlertShowcaseWork");
            DropStoredProcedure("TestAlertSocialMediaVerification");
            DropStoredProcedure("TestAlertTaxDocs");
            DropStoredProcedure("TestAlertVerifyEmail");
            DropStoredProcedure("TestAllUserAlerts");
            DropStoredProcedure("TestAllUsersAlerts");
            DropStoredProcedure("TestProfileActivation");
            DropStoredProcedure("UnDeleteUser");
            DropStoredProcedure("ut_AutocheckReviewVerifications");
            DropStoredProcedure("ut_ModifyUserAlertsState");
            DropStoredProcedure("ZZIsUserAProvider");
        }
    }
}
