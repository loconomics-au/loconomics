using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Web.Helpers;
using ASP;
using System.Net;
using System.Web.Caching;
using System.Configuration;

/// <summary>
/// Descripción breve de LcMessaging
/// </summary>
public class LcMessaging
{
    #region SQLs
    private static readonly string sqlInsThread = @"
        INSERT INTO [MessagingThreads]
                   ([CustomerUserID]
                   ,[ProviderUserID]
                   ,[PositionID]
                   ,[MessageThreadStatusID]
                   ,[Subject]
                   ,[CreatedDate]
                   ,[UpdatedDate]
                   ,[ModifiedBy])
             VALUES
                   (@0, @1, @2,
                    1, -- Status is 1 ever at first message (not responded)
                    @3,
                    getdate(), getdate(), 'sys')
        SELECT @@Identity As MessagingThreadID
    ";
    private static readonly string sqlUpdThread = @"
        UPDATE MessagingThreads
        SET     MessageThreadStatusID = coalesce(@1, MessagingThreads.MessageThreadStatusID),
                LastMessageID = @2,
                Subject = coalesce(@3, MessagingThreads.Subject),
                UpdatedDate = getdate(),
                ModifiedBy = 'sys'
        WHERE   ThreadID = @0
    ";
    private static readonly string sqlInsMessage = @"
        INSERT INTO [Messages]
                   (ThreadID
                   ,MessageTypeID
                   ,BodyText
                   ,AuxID
                   ,AuxT
                   ,SentByUserID
                   ,[CreatedDate]
                   ,[UpdatedDate]
                   ,[ModifiedBy])
            VALUES (@0, @1, @2, @3, @4, @5, getdate(), getdate(), 'sys')
        SELECT @@Identity As MessageID
    ";
    private static readonly string sqlGetThread = @"
        SELECT CustomerUserID, ProviderUserID, PositionID, MessageThreadStatusID, Subject
        FROM    MessagingThreads
        WHERE   ThreadID = @0
    ";
    private static readonly string sqlGetUserData = @"
        SELECT  U.FirstName, U.LastName, U.UserID, P.Email
        FROM Users As U
              INNER JOIN
             UserProfile As P
               ON U.UserID = P.UserID
        WHERE   U.UserID = @0
    ";
    private static readonly string sqlGetThreadByAux = @"
        SELECT  ThreadID, CustomerUserID, ProviderUserID, PositionID, MessageThreadStatusID, Subject
        FROM    MessagingThreads
        WHERE   ThreadID = (
                SELECT TOP 1 ThreadID
                FROM Messages
                WHERE Messages.AuxID = @0 -- BookingID, BookingRequestID or another posible Auxiliar IDs
                       AND
                      Messages.AuxT = @1 -- Table/Type AuxID name
                ORDER BY ThreadID DESC -- We get the last ThreadID
            )
    ";
    #endregion

    #region Database operations
    /// <summary>
    /// Returns the new MessageID
    /// 
    ///MessageTypeID	MessageTypeName
    ///1	Customer inquiry
    ///2	Copy of customer inquiry
    ///3	Provider response to inquiry
    ///4	Customer booking request
    ///5	Copy of customer booking request
    ///6	Customer booking confirmation
    ///7	Provider booking confirmation
    ///8	Customer marketing
    ///9	Customer dispute
    ///10	Provider resolution
    ///11	Provider review
    ///12	Pricing adjustment to provider
    /// </summary>
    /// <param name="CustomerUserID"></param>
    /// <param name="ProviderUserID"></param>
    /// <param name="PositionID"></param>
    /// <param name="FirstMessageTypeID"></param>
    /// <param name="FirstMessageBody"></param>
    /// <returns></returns>
    public static int CreateThread(int CustomerUserID, int ProviderUserID, int PositionID, string ThreadSubject, int FirstMessageTypeID, string FirstMessageBody, int SentByUserID, int FirstMessageAuxID = -1, string FirstMessageAuxT = null)
    {
        int threadID = 0;
        using (var db = Database.Open("sqlloco"))
        {
            threadID = (int)db.QueryValue(sqlInsThread, CustomerUserID, ProviderUserID, PositionID, ThreadSubject);
            int messageID = (int)db.QueryValue(sqlInsMessage, threadID, FirstMessageTypeID, FirstMessageBody, (FirstMessageAuxID == -1 ? null : (object)FirstMessageAuxID), FirstMessageAuxT, SentByUserID);
            // Update created thread with the lastMessageID
            db.Execute(sqlUpdThread, threadID, null, messageID, null);
        }
        return threadID;
    }
    /// <summary>
    /// Returns the new MessageID
    ///MessageTypeID	MessageTypeName
    ///1	Customer inquiry
    ///2	Copy of customer inquiry
    ///3	Provider response to inquiry
    ///4	Customer booking request
    ///5	Copy of customer booking request
    ///6	Customer booking confirmation
    ///7	Provider booking confirmation
    ///8	Customer marketing
    ///9	Customer dispute
    ///10	Provider resolution
    ///11	Provider review
    ///12	Pricing adjustment to provider
    /// </summary>
    /// <param name="ThreadID"></param>
    /// <param name="MessageTypeID"></param>
    /// <param name="MessageBody"></param>
    /// <returns></returns>
    public static int CreateMessage(int ThreadID, int MessageThreadStatusID, int MessageTypeID, string MessageBody, int SentByUserID, int MessageAuxID = -1, string MessageAuxT = null, string NewThreadSubject = null)
    {
        int messageID = 0;
        using (var db = Database.Open("sqlloco"))
        {
            // Create Message
            messageID = (int)db.QueryValue(sqlInsMessage, ThreadID, MessageTypeID, MessageBody, (MessageAuxID == -1 ? null : (object)MessageAuxID), MessageAuxT, SentByUserID);
            // Update Thread status (and date automatically)
            db.Execute(sqlUpdThread, ThreadID, MessageThreadStatusID, messageID, NewThreadSubject);
        }
        return messageID;
    }
    #endregion

    #region Table Enumerations
    public enum MessageType : int
    {
        ClientInquiry = 1,
        CopyOfClientInquiry = 2,
        ProfessionalResponseToInquiry = 3,
        ClientBookingRequest = 4,
        CopyOfClientBookingRequest = 5,
        BookingRequestClientConfirmation = 6,
        BookingRequestProfessionalConfirmation = 7,
        ClientMarketing = 8,
        ClientDispute = 9,
        ProfessionalResolution = 10,
        PricingAdjustmentToProfessional = 12,
        BookingRequestProfessionalDeclined = 13,
        BookingRequestClientCancelled = 14,
        BookingProfessionalUpdate = 15,
        BookingClientUpdate = 16,
        ProfessionalBookingReview = 17,
        ClientBookingReview = 18,
        BookingUpdate = 19,
        ServicePerformed = 20,
        BookingCompleted = 21,
        ProfessionalInquiry = 22,
        ClientResponseToInquiry = 23,
        //
        ProfessionalBooking = 50,
        RequestToReview = 51,
        RequestToReviewReminder = 52,
        BookingRequestExpired = 53,
        BookingReminder = 54,
        BookingRequestDeclined = 55
    }
    public enum MessageThreadStatus : int
    {
        Respond = 1,
        Responded = 2
    }
    #endregion

    #region Database queries (showing list, details, etc)
    private static readonly Dictionary<string, string> sqlListMessageThread = new Dictionary<string,string> {
    { "select", "SELECT " },    
    { "select-fields", @"
                T.ThreadID,
                T.CustomerUserID,
                T.ProviderUserID,
                T.PositionID,
                T.MessageThreadStatusID,
                T.UpdatedDate As LastMessageDate,
                T.Subject,

                T.LastMessageID,
                M.BodyText As LastMessageBodyText,
                M.MessageTypeID As LastMessageTypeID,
                M.AuxID As LastMessageAuxID,
                M.AuxT As LastMessageAuxT,
                M.SentByUserID As LastMessageSendByUserID,

                UC.FirstName As CustomerFirstName,
                UC.LastName As CustomerLastName,

                UP.FirstName As ProviderFirstName,
                UP.LastName As ProviderLastName,

                Pos.PositionSingular
    "},
    { "from", @"
        FROM    MessagingThreads As T
                 INNER JOIN
                Messages As M
                  ON M.ThreadID = T.ThreadID
                      AND
                     M.MessageID = T.LastMessageID
                 INNER JOIN
                Users As UC
                  ON UC.UserID = T.CustomerUserID
                 INNER JOIN
                Users As UP
                  ON UP.UserID = T.ProviderUserID
                 INNER JOIN
                Positions As Pos
                  ON Pos.PositionID = T.PositionID
					AND Pos.CountryID = @2 AND Pos.LanguageID = @1
    "},
    { "where", @"
        WHERE   (T.CustomerUserID = @0 OR T.ProviderUserID = @0)
    "},
    { "order-by", @"
        ORDER BY T.UpdatedDate DESC
    "},
    };
    public static dynamic GetMessageThreadList(int userID)
    {
        var sql = String.Join(" ", sqlListMessageThread.Values);
        using (var db = Database.Open("sqlloco")) {
            return db.Query(sql, userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
        }
    }
    public static Dictionary<string, dynamic> GetLastNewReadSentMessages(int userID, int maxPerType = 3)
    {
        var commonSql = 
            "SELECT TOP " + maxPerType + " " +
            sqlListMessageThread["select-fields"] + 
            sqlListMessageThread["from"] + 
            sqlListMessageThread["where"];
        var order = sqlListMessageThread["order-by"];
        var sqlNew = commonSql + " AND T.MessageThreadStatusID = 1 AND M.SentByUserID <> @0 " + order;
        var sqlRead = commonSql + " AND T.MessageThreadStatusID = 2 AND M.SentByUserID <> @0 " + order;
        var sqlSent = commonSql + " AND M.SentByUserID = @0 " + order;
        var sqlList = new Dictionary<string, string> {
            { "new", sqlNew },
            { "read", sqlRead },
            { "sent", sqlSent }
        };

        var ret = new Dictionary<string, dynamic>();
        using (var db = Database.Open("sqlloco")) {
            foreach (var sql in sqlList)
            {
                dynamic d = db.Query(sql.Value, userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                if (d != null && d.Count > 0)
                    ret[sql.Key] = d;
            }
        }
        return ret;
    }
    #endregion

    #region Type:Booking
    /// <summary>
    /// Implements methods to send messages about bookings with the full set of
    /// available templates for each type of booking.
    /// The base SendBooking class works as a state machine with helper methods that prepare the data
    /// and performs common logic. Derivated classes based on type of booking implements the specific template messages,
    /// using the base class making implementation of each template easier and shorter.
    /// 
    /// Samples usage:
    ///  LcMessaging.SendBooking.Marketplace.For(bookingID).BookingRequestExpired();
    ///  LcMessaging.SendBooking.BookingReminder(b.bookingID);
    /// </summary>
    public class SendBooking
    {
        #region Static Utils
        static string GetBookingThreadSubject(LcEmailTemplate.BookingEmailInfo info)
        {
            return info.userJobTitle.title + " " +
                info.booking.serviceDate.startTime.ToString("D") + ", " +
                info.booking.serviceDate.startTime.ToString("t") + " to " +
                info.booking.serviceDate.endTime.ToString("t");
        }
        static string GetBookingThreadBody(LcEmailTemplate.BookingEmailInfo info)
        {
            // Using a services summary as first thread message body:
            return LcRest.PricingSummary.GetOneLineDescription(info.booking.pricingSummary);
        }
        public class JobTitleMessagingFlags
        {
            public bool hipaa;
            public bool sendReviewReminderToClient;
            public static JobTitleMessagingFlags FromDB(dynamic record)
            {
                if (record == null) return null;
                return new JobTitleMessagingFlags
                {
                    hipaa = record.hipaa,
                    sendReviewReminderToClient = record.sendReviewReminderToClient
                };
            }
            public static JobTitleMessagingFlags Get(int jobTitleID, int languageID, int countryID)
            {
                using (var db = new LcDatabase())
                {
                    return JobTitleMessagingFlags.FromDB(db.QuerySingle(@"
                    SELECT TOP 1
                        coalesce(HIPAA, cast(0 as bit)) as hipaa,
                        coalesce(SendReviewReminderToClient, cast(0 as bit)) as sendReviewReminderToClient
                    FROM positions
                    WHERE positionID = @0 AND languageID = @1 AND countryID = @2
                ", jobTitleID, languageID, countryID));
                }
            }
        }
        static int CreateBookingThread(LcEmailTemplate.BookingEmailInfo info, int messageType, int sentByUserID)
        {
            var threadSubject = GetBookingThreadSubject(info);
            var threadBody = GetBookingThreadBody(info);
            return CreateThread(info.booking.clientUserID, info.booking.serviceProfessionalUserID, info.booking.jobTitleID, threadSubject, messageType, threadBody, sentByUserID, info.booking.bookingID, "booking");
        }
        static int CreateBookingMessage(LcEmailTemplate.BookingEmailInfo info, int messageType, int threadStatusID, int sentByUserID, string message, bool includeBookingDetails)
        {
            using (var db = new LcDatabase())
            {
                // Get Thread info
                var thread = db.QuerySingle(sqlGetThreadByAux, info.booking.bookingID, "booking");
                int threadID = 0;
                // For security, if no thread exists yet (some problem or old version that didn't generate thread properly), create one now and get ID
                if (thread == null)
                    threadID = CreateBookingThread(info, messageType, sentByUserID);
                else
                    threadID = thread.threadID;
                if (includeBookingDetails)
                    message += (message[message.Length - 1] == '.' ? "" : ". ") + "\n" + GetBookingThreadBody(info);
                return CreateMessage(threadID, threadStatusID, messageType, message, sentByUserID, info.booking.bookingID, "booking");
            }
        }
        #endregion
        #region State data
        string path = "EmailCommunications/Booking/";
        string tpl = "";
        string toEmail = "";
        string fromEmail = "";
        string replyTo = "";
        string subject = "";
        string automatedEmail = ConfigurationManager.AppSettings["AutomatedEmail"];
        LcEmailTemplate.BookingEmailInfo info;
        JobTitleMessagingFlags flags;
        #endregion
        #region Internal methods
        public SendBooking(string subPath)
        {
            path += subPath;
        }
        void send()
        {
            SendMail(toEmail, subject,
                ApplyTemplate(LcUrl.LangPath + path + tpl,
                new Dictionary<string, object> {
                    { "bookingID", info.booking.bookingID }
                    ,{ "RequestKey", SecurityRequestKey }
                }), fromEmail, replyTo: replyTo
            );
        }
        void prepareData(int bookingID)
        {
            info = LcEmailTemplate.GetBookingInfo(bookingID);
            flags = JobTitleMessagingFlags.Get(info.booking.jobTitleID, info.booking.languageID, info.booking.countryID);
        }
        void prepareData(LcEmailTemplate.BookingEmailInfo info)
        {
            this.info = info;
            flags = JobTitleMessagingFlags.Get(info.booking.jobTitleID, info.booking.languageID, info.booking.countryID);
        }
        protected virtual string getSenderForClient()
        {
            return string.Format("{0} {1} <{2}>", info.serviceProfessional.firstName, info.serviceProfessional.lastName, automatedEmail);
        }
        protected virtual string getSenderForServiceProfessional()
        {
            return string.Format("Loconomics Scheduler <{0}>", automatedEmail);
        }
        void sendToClient(string tplName)
        {
            toEmail = info.client.email;
            replyTo = info.serviceProfessional.email;
            fromEmail = getSenderForClient();
            tpl = "ToClient/" + tplName + (flags.hipaa ? "HIPAA" : "");
            send();
        }
        void sendToServiceProfessional(string tplName)
        {
            toEmail = info.serviceProfessional.email;
            replyTo = info.client.email;
            fromEmail = getSenderForServiceProfessional();
            tpl = "ToServiceProfessional/" + tplName + (flags.hipaa ? "HIPAA" : "");
            send();
        }
        #endregion
        #region Common Interface methods
        /// <summary>
        /// Connected: Yes (ScheduleTask)
        /// </summary>
        public virtual void BookingReminder() { }
        /// <summary>
        /// Connected: Yes (ScheduleTask)
        /// </summary>
        /// <param name="isReminder"></param>
        public virtual void RequestToReviewReminder() { }
        /// <summary>
        /// Connected: Yes (ScheduleTask)
        /// </summary>
        public virtual void ServicePerformed() { }
        /// <summary>
        /// Connected: Yes (ScheduleTask)
        /// </summary>
        public virtual void BookingCompleted() { }
        /// <summary>
        /// Connected: Yes (LcRest.Booking.InsClientBooking)
        /// </summary>
        public virtual void BookingRequest() { }
        /// <summary>
        /// Connected: Yes (ScheduleTask)
        /// </summary>
        public virtual void BookingRequestExpired() { }
        /// <summary>
        /// Connected: Yes (LcRest.Booking.InsClientBooking and LcRest.Booking.InsServiceProfessionalBooking)
        /// </summary>
        public virtual void InstantBookingConfirmed() { }
        /// <summary>
        /// Connected: Yes LcRest.Booking.UpdClientBooking
        /// </summary>
        public virtual void BookingUpdatedByClient() { }
        /// <summary>
        /// Connected: Yes LcRest.Booking.CancelBookingByServiceProfessional
        /// </summary>
        public virtual void BookingCancelledByServiceProfessional() { }
        /// <summary>
        /// Connected: Yes LcRest.Booking.UpdServiceProfessionalBooking
        /// </summary>
        public virtual void BookingUpdatedByServiceProfessional() { }
        /// <summary>
        /// Connected: Yes LcRest.Booking.CancelBookingByClient
        /// </summary>
        public virtual void BookingCancelledByClient() { }
        /// <summary>
        /// Connected: Yes
        /// </summary>
        public virtual void BookingRequestDeclined() { }
        /// <summary>
        /// Connected: Yes
        /// </summary>
        public virtual void BookingRequestConfirmed() { }
        #endregion
        #region Access to singletons for Types of Bookings
        public static SendServiceProfessionalBooking ServiceProfessionalBooking = new SendServiceProfessionalBooking();
        public static SendMarketplaceBooking Marketplace = new SendMarketplaceBooking();
        public static SendBookNowBooking BookNow = new SendBookNowBooking();
        #endregion
        #region Types of Bookings
        public class SendServiceProfessionalBooking : SendBooking
        {
            public SendServiceProfessionalBooking() : base("ServiceProfessionalBooking/") {}
            public new SendServiceProfessionalBooking For(int bookingID)
            {
                prepareData(bookingID);
                return this;
            }
            public SendServiceProfessionalBooking For(LcEmailTemplate.BookingEmailInfo info)
            {
                prepareData(info);
                return this;
            }

            // TODO: i18n make string set from service 
            public override void BookingCancelledByClient()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingClientUpdate, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, true);

                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByClient");

                subject = String.Format("{0} has cancelled their appointment", info.client.firstName);
                sendToServiceProfessional("BookingCancelledByClient");
            }
            public override void BookingCancelledByServiceProfessional()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.serviceProfessional.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestProfessionalDeclined, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, false);
                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByServiceProfessional");
            }
            public override void BookingReminder()
            {
                subject = String.Format("Reminder about your appointment {0}", LcUtils.Time.ZonedTimesRangeToString(info.booking.serviceDate));
                CreateBookingMessage(info, (int)MessageType.BookingReminder, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("BookingReminder");
            }
            public override void BookingUpdatedByClient()
            {
                var neutralSubject = String.Format("Appointment updated by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestClientCancelled, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, false);

                subject = "Updated appointment confirmation";
                sendToClient("BookingUpdatedByClient");

                subject = String.Format("{0} has changed their appointment", info.client.firstName);
                sendToServiceProfessional("BookingUpdatedByClient");
            }
            public override void BookingUpdatedByServiceProfessional()
            {
                subject = "Your appointment has been updated";
                CreateBookingMessage(info, (int)MessageType.BookingProfessionalUpdate, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                sendToClient("BookingUpdatedByServiceProfessional");
            }
            public override void InstantBookingConfirmed()
            {
                // Restriction:
                if (!flags.sendReviewReminderToClient) return;
                subject = "Your appointment confirmation";
                CreateBookingThread(info, (int)MessageType.ProfessionalBooking, info.booking.serviceProfessionalUserID);
                sendToClient("InstantBookingConfirmed");
            }
            public override void RequestToReviewReminder()
            {
                // Restriction:
                if (!flags.sendReviewReminderToClient) return;
                subject = "Reminder to review my services";
                CreateBookingMessage(info, (int)MessageType.RequestToReviewReminder, (int)MessageThreadStatus.Respond, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("RequestToReviewReminder");
            }
            public override void ServicePerformed()
            {
                // Service Performed is registered in the Inbox Thread but no e-mail is sent (decission to not send email at https://github.com/joshdanielson/Loconomics/issues/844#issuecomment-169066719)
                subject = "Service performed and pricing estimate 100% accurate";
                CreateBookingMessage(info, (int)MessageType.ServicePerformed, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
            }
            public override void BookingCompleted()
            {
                subject = "Client has paid in full and service professional has been paid in full";
                CreateBookingMessage(info, (int)MessageType.BookingCompleted, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                subject = "Thank you and request to review my services";
                sendToClient("BookingCompleted");
            }
        }
        public class SendMarketplaceBooking : SendBooking
        {
            public SendMarketplaceBooking() : base("Marketplace/") { }
            public new SendMarketplaceBooking For(int bookingID)
            {
                prepareData(bookingID);
                return this;
            }
            public SendMarketplaceBooking For(LcEmailTemplate.BookingEmailInfo info)
            {
                prepareData(info);
                return this;
            }
            protected override string getSenderForClient()
            {
                return string.Format("Loconomics <{0}>", automatedEmail);
            }
            protected override string getSenderForServiceProfessional()
            {
                return string.Format("Loconomics Marketplace <{0}>", automatedEmail);
            }
            // TODO: i18n make string set from service 
            public override void BookingCancelledByClient()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingClientUpdate, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, true);

                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByClient");

                subject = String.Format("{0} has cancelled their appointment", info.client.firstName);
                sendToServiceProfessional("BookingCancelledByClient");
            }
            public override void BookingCancelledByServiceProfessional()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.serviceProfessional.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestProfessionalDeclined, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, false);
                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByServiceProfessional");
            }
            public override void BookingReminder()
            {
                subject = String.Format("Reminder about your appointment {0}", LcUtils.Time.ZonedTimesRangeToString(info.booking.serviceDate));
                CreateBookingMessage(info, (int)MessageType.BookingReminder, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("BookingReminder");
            }
            public override void BookingRequestConfirmed()
            {
                subject = "Appointment confirmed";
                CreateBookingMessage(info, (int)MessageType.BookingRequestProfessionalConfirmation, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, false);
                subject = "Your appointment is confirmed";
                sendToClient("BookingRequestConfirmed");
                subject = String.Format("Your appointment with {0} is confirmed", info.client.firstName);
                sendToServiceProfessional("BookingRequestConfirmed");
            }
            public override void BookingRequestDeclined()
            {
                var neutralSubject = "Declined appointment request";
                CreateBookingMessage(info, (int)MessageType.BookingRequestDeclined, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, true);
                subject = "I'm unable to accept your booking request at this time";
                sendToClient("BookingRequestDeclined");
            }
            public override void BookingRequestExpired()
            {
                var neutralSubject = "Booking request has expired";
                CreateBookingMessage(info, (int)MessageType.BookingRequestExpired, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, true);

                subject = "Your appointment request has expired";
                sendToClient("BookingRequestExpired");

                subject = String.Format("{0}'s appointment request has expired", info.client.firstName);
                sendToServiceProfessional("BookingRequestExpired");
            }
            public override void BookingRequest()
            {
                subject = "Appointment request received";
                CreateBookingThread(info, (int)MessageType.ClientBookingRequest, info.booking.clientUserID);
                sendToClient("BookingRequestSummary");
                sendToServiceProfessional("BookingRequestSummary");
            }
            public override void BookingUpdatedByClient()
            {
                var neutralSubject = String.Format("Appointment updated by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestClientCancelled, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, false);

                subject = "Updated appointment confirmation";
                sendToClient("BookingUpdatedByClient");

                subject = String.Format("{0} has changed their appointment", info.client.firstName);
                sendToServiceProfessional("BookingUpdatedByClient");
            }
            public override void BookingUpdatedByServiceProfessional()
            {
                subject = "Your appointment has been updated";
                CreateBookingMessage(info, (int)MessageType.BookingProfessionalUpdate, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                sendToClient("BookingUpdatedByServiceProfessional");
            }
            public override void InstantBookingConfirmed()
            {
                subject = "Your appointment confirmation";
                CreateBookingThread(info, (int)MessageType.BookingRequestClientConfirmation, info.booking.clientUserID);
                sendToClient("InstantBookingConfirmed");
                sendToServiceProfessional("InstantBookingConfirmed");
            }
            public override void RequestToReviewReminder()
            {
                // Restriction:
                if (!flags.sendReviewReminderToClient) return;
                subject = "Reminder to review my services";
                CreateBookingMessage(info, (int)MessageType.RequestToReviewReminder, (int)MessageThreadStatus.Respond, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("RequestToReviewReminder");
                if (!flags.hipaa)
                {
                    sendToServiceProfessional("RequestToReviewReminder");
                }
            }
            public override void ServicePerformed()
            {
                // Service Performed is registered in the Inbox Thread but no e-mail is sent (decission to not send email at https://github.com/joshdanielson/Loconomics/issues/844#issuecomment-169066719)
                subject = "Service performed and pricing estimate 100% accurate";
                CreateBookingMessage(info, (int)MessageType.ServicePerformed, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
            }
            public override void BookingCompleted()
            {
                subject = "Client has paid in full and service professional has been paid in full";
                CreateBookingMessage(info, (int)MessageType.BookingCompleted, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                subject = "Thank you and request to review my services";
                sendToClient("BookingCompleted");
                subject = String.Format("How'd it go with {0}?", info.client.firstName);
                sendToServiceProfessional("BookingCompleted");
            }
        }
        public class SendBookNowBooking : SendBooking
        {
            public SendBookNowBooking() : base("BookNow/") { }
            public new SendBookNowBooking For(int bookingID)
            {
                prepareData(bookingID);
                return this;
            }
            public SendBookNowBooking For(LcEmailTemplate.BookingEmailInfo info)
            {
                prepareData(info);
                return this;
            }
            public override void BookingCancelledByClient()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingClientUpdate, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, true);

                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByClient");

                subject = String.Format("{0} has cancelled their appointment", info.client.firstName);
                sendToServiceProfessional("BookingCancelledByClient");
            }
            public override void BookingCancelledByServiceProfessional()
            {
                var neutralSubject = String.Format("Appointment cancelled by {0}", info.serviceProfessional.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestProfessionalDeclined, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, false);
                subject = "Your appointment has been cancelled";
                sendToClient("BookingCancelledByServiceProfessional");
            }
            public override void BookingReminder()
            {
                subject = String.Format("Reminder about your appointment {0}", LcUtils.Time.ZonedTimesRangeToString(info.booking.serviceDate));
                CreateBookingMessage(info, (int)MessageType.BookingReminder, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("BookingReminder");
            }
            public override void BookingRequestConfirmed()
            {
                subject = "Appointment confirmed";
                CreateBookingMessage(info, (int)MessageType.BookingRequestProfessionalConfirmation, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, false);
                subject = "Your appointment is confirmed";
                sendToClient("BookingRequestConfirmed");
                subject = String.Format("Your appointment with {0} is confirmed", info.client.firstName);
                sendToServiceProfessional("BookingRequestConfirmed");
            }
            public override void BookingRequestDeclined()
            {
                var neutralSubject = "Declined appointment request";
                CreateBookingMessage(info, (int)MessageType.BookingRequestDeclined, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, true);
                subject = "I'm unable to accept your booking request at this time";
                sendToClient("BookingRequestDeclined");
            }
            public override void BookingRequestExpired()
            {
                var neutralSubject = "Booking request has expired";
                CreateBookingMessage(info, (int)MessageType.BookingRequestExpired, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, neutralSubject, true);

                subject = "Your appointment request has expired";
                sendToClient("BookingRequestExpired");

                subject = String.Format("{0}'s appointment request has expired", info.client.firstName);
                sendToServiceProfessional("BookingRequestExpired");
            }
            public override void BookingRequest()
            {
                subject = "Appointment request received";
                CreateBookingThread(info, (int)MessageType.ClientBookingRequest, info.booking.clientUserID);
                sendToClient("BookingRequestSummary");
                sendToServiceProfessional("BookingRequestSummary");
            }
            public override void BookingUpdatedByClient()
            {
                var neutralSubject = String.Format("Appointment updated by {0}", info.client.firstName);
                CreateBookingMessage(info, (int)MessageType.BookingRequestClientCancelled, (int)MessageThreadStatus.Responded, info.booking.clientUserID, neutralSubject, false);

                subject = "Updated appointment confirmation";
                sendToClient("BookingUpdatedByClient");

                subject = String.Format("{0} has changed their appointment", info.client.firstName);
                sendToServiceProfessional("BookingUpdatedByClient");
            }            
            public override void BookingUpdatedByServiceProfessional()
            {
                subject = "Your appointment has been updated";
                CreateBookingMessage(info, (int)MessageType.BookingProfessionalUpdate, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                sendToClient("BookingUpdatedByServiceProfessional");
            }
            public override void InstantBookingConfirmed()
            {
                subject = "Your appointment confirmation";
                CreateBookingThread(info, (int)MessageType.BookingRequestClientConfirmation, info.booking.clientUserID);
                sendToClient("InstantBookingConfirmed");
                sendToServiceProfessional("InstantBookingConfirmed");
            }
            public override void RequestToReviewReminder()
            {
                // Restriction:
                if (!flags.sendReviewReminderToClient) return;
                subject = "Reminder to review my services";
                CreateBookingMessage(info, (int)MessageType.RequestToReviewReminder, (int)MessageThreadStatus.Respond, info.booking.serviceProfessionalUserID, subject, false);
                sendToClient("RequestToReviewReminder");
            }
            public override void ServicePerformed()
            {
                // Service Performed is registered in the Inbox Thread but no e-mail is sent (decission to not send email at https://github.com/joshdanielson/Loconomics/issues/844#issuecomment-169066719)
                subject = "Service performed and pricing estimate 100% accurate";
                CreateBookingMessage(info, (int)MessageType.ServicePerformed, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
            }
            public override void BookingCompleted()
            {
                subject = info.booking.paymentCollected ? "Client has paid in full and service professional has been paid in full" : "Booking completed";
                CreateBookingMessage(info, (int)MessageType.BookingCompleted, (int)MessageThreadStatus.Responded, info.booking.serviceProfessionalUserID, subject, true);
                if (flags.sendReviewReminderToClient)
                {
                    subject = "Thank you and request to review my services";
                    sendToClient("BookingCompleted");
                }
                if (flags.hipaa && info.booking.paymentCollected)
                {
                    subject = "Your payment has been sent";
                    sendToServiceProfessional("BookingCompleted");
                }
            }
        }
        #endregion
        /// <summary>
        /// Factory that provides the correct SendBooking instance based on the booking type and fills the booking data.
        /// </summary>
        /// <param name="bookingID"></param>
        /// <returns></returns>
        public static SendBooking For(int bookingID)
        {
            var info = LcEmailTemplate.GetBookingInfo(bookingID);
            switch ((LcEnum.BookingType)info.booking.bookingTypeID)
            {
                case LcEnum.BookingType.bookNowBooking:
                    return BookNow.For(info);
                case LcEnum.BookingType.marketplaceBooking:
                    return Marketplace.For(info);
                case LcEnum.BookingType.serviceProfessionalBooking:
                    return ServiceProfessionalBooking.For(info);
                case LcEnum.BookingType.exchangeBooking:
                    throw new NotImplementedException("Exchange BookingReminder");
                case LcEnum.BookingType.partnerBooking:
                    throw new NotImplementedException("Partner BookingReminder");
                default:
                    throw new NotImplementedException("Unknow booking type");
            }
        }
    }
    #endregion

    #region TODO Type:Inquiry. See TODO notes inside region
    // IMPORTANT Current SendMail code for inquiries is at LcRest/Thread and LcRest/Message 'PostInquiry' methods.
    // TODO Check if better move specific email sending here while keeping database there
    // TODO Using old EmailInquiry template; new email templates not complete (expected to be under EmailCommunications/Messenger)
    #endregion

    #region Type:Admin Account
    public static void SendWelcomeProvider(int userID, string userEmail)
    {
        SendMail(userEmail, "[Action Required] Welcome to Loconomics!",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/ToServiceProfessional/Welcome/",
            new Dictionary<string,object> {
                { "userID", userID }
         }), "Loconomics Cooperative <automated@loconomics.com>");
    }
    public static void SendWelcomeCustomer(int userID, string userEmail)
    {
        SendMail(userEmail, "[Action Required] Welcome to Loconomics!",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/ToClient/Welcome/",
            new Dictionary<string, object> {
                { "userID", userID }
        }), "Loconomics Cooperative <automated@loconomics.com>");
    }
    public static void SendResetPassword(int userID, string userEmail, string token)
    {
        SendMail(userEmail, "Forget being forgetful",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/ToUser/ResetPassword/",
            new Dictionary<string, object> {
                { "UserID", userID },
                { "passwordResetToken", token }
        }));
    }
    #endregion

    #region Type:Admin ServiceProfessional specifics
    public static void SendBackgroundCheckRequestReceived(int userID, string userEmail)
    {
        SendMail(userEmail, "[Action Required] We've received your background check request",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/ToServiceProfessional/BackgroundCheckRequestReceived/",
            new Dictionary<string, object> {
                { "UserID", userID }
        }), "Loconomics Marketplace <automated@loconomics.com>");
    }
    public static void SendOptionalCertificationVerificationRequestReceived(int userID, string userEmail)
    {
        SendMail(userEmail, "We've received your license/certification verification request",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/ToServiceProfessional/OptionalCertificationVerificationRequestReceived/",
            new Dictionary<string, object> {
                { "UserID", userID }
        }), "Loconomics Marketplace <automated@loconomics.com>");
    }
    public static void SendRequiredLicenseVerificationRequestReceived(int userID, string userEmail)
    {
        SendMail(userEmail, "We've received your license/certification verification request",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/ToServiceProfessional/RequiredLicenseVerificationRequestReceived/",
            new Dictionary<string, object> {
                { "UserID", userID }
        }), "Loconomics Marketplace <automated@loconomics.com>");
    }
    /// <summary>
    /// Sended when scheduled task indicates service professional has their marketplace profile activated, and they've completed two bookings
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="userEmail"></param>
    public static void SendOwnerInvitation(int userID, string userEmail)
    {
        SendMail(userEmail, "[Action Required] You're invited to become an owner",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/ToServiceProfessional/OwnerInvitation/",
            new Dictionary<string, object> {
                { "UserID", userID }
        }), "Loconomics Marketplace <automated@loconomics.com>");
    }
    /// <summary>
    /// Sended when scheduled task indicates the professional must be reminded to enter its earnings
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="userEmail"></param>
    public static void SendEarningsEntryReminder(int userID, string userEmail)
    {
        SendMail(userEmail, "[Action Required] Reminder to enter your earnings",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/ToServiceProfessional/EarningsEntryReminder/",
            new Dictionary<string, object> {
                { "UserID", userID }
        }), "Loconomics Cooperative <automated@loconomics.com>");
    }
    #endregion

    #region Type:Admin/Internal Notifications to Loconomics Stuff/Support
    public static void NotifyLockedAccount(string lockedEmail, int lockedUserID, DateTime whenHappened)
    {
        try
        {
            SendMail("hipaasecurityofficial@loconomics.com", "Account Locked Out",
                String.Format("Attempt to log-in ended in 'Account Lock Out' message for userID:{0}, email:{1} at {2}", lockedUserID, lockedEmail, whenHappened)
            );
        }
        catch { }
    }
    public static void NotifyError(string where, string url, string exceptionPageContent)
    {
        try
        {
            // TODO: make support email config setting
            SendMail("support@loconomics.com", LcHelpers.Channel + ": Exception on " + where + ": " + url,
                exceptionPageContent);
        }
        catch { }
    }
    public static void NotifyNewJobTitle(string jobTitleName, int jobTitleID)
    {
        try
        {
            var channel = LcHelpers.Channel == "live" ? "" : " at " + LcHelpers.Channel;
            SendMail("support@loconomics.zendesk.com",
                "New job title" + channel + ": " + jobTitleName,
                "Generated new job title with name '" + jobTitleName + "', assigned ID: " + jobTitleID
            );
        }
        catch { }
    }
    public static void NotifyNewServiceAttributes(int userID, int jobTitleID, Dictionary<int, List<string>> proposedAttributes)
    {
        try
        {
            var msg = String.Format("Generated new service attributes by userID:{0} for job title:{1}, pending of approval:<br/>\n<br/>\n", userID, jobTitleID);
            msg += String.Join("<br/>\n", proposedAttributes
                .Select(x => String.Format("- For serviceAttributeCategoryID {0}: {1}", x.Key, String.Join(", ", x.Value)))
            );

            var channel = LcHelpers.Channel == "live" ? "" : " at " + LcHelpers.Channel;
            SendMail("support@loconomics.zendesk.com",
                "New service attributes" + channel,
                msg
            );
        }
        catch { }
    }
    public static void SendMerchantAccountNotification(int providerUserID)
    {
        SendMail("support@loconomics.com", "Marketplace: Merchant Account Notification",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/Internal/EmailProviderPaymentAccountNotification/",
            new Dictionary<string, object> {
                { "userID", providerUserID}
         }));
    }
    public static void SendReportUnauthorizedUse(int reportedByUserID, int reportedUserID, string message)
    {
        SendMail("legal@loconomics.com", "Report of Unauthorized Use",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/Internal/EmailReportUnauthorizedUse/",
            new Dictionary<string, object> {
                { "ReportedByUserID", reportedByUserID },
                { "ReportedUserID", reportedUserID },
                { "Message", message },
                { "EmailTo", "legal@loconomics.com" }
         }));
    }
    public static void SendBackgroundCheckRequest(int userID, int backgroundCheckID)
    {
        SendMail("support@loconomics.com", "Background Check Request",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/Internal/EmailBackgroundCheckRequest/",
            new Dictionary<string, object> {
                { "userID", userID },
                { "backgroundCheckID", backgroundCheckID }
         }));
    }
    public static void SendLicenseVerificationRequest(int userID, int jobTitleID, int licenseCertificationID)
    {
        SendMail("support@loconomics.com", "License Verification Request",
            ApplyTemplate(LcUrl.LangPath + "EmailCommunications/Admin/Internal/EmailLicenseVerificationRequest/",
            new Dictionary<string, object> {
                { "userID", userID },
                { "jobTitleID", jobTitleID },
                { "licenseCertificationID", licenseCertificationID }
         }));
    }
    #endregion

    #region Template System
    public static string ApplyTemplate(string tplUrl, Dictionary<string, object> data)
    {
        string rtn = "";

        using (WebClient w = new WebClient())
        {
            w.Encoding = System.Text.Encoding.UTF8;

            // Setup URL
            string completeURL = LcUrl.SiteUrl + LcUrl.GetTheGoodURL(tplUrl);
            if (LcHelpers.Channel != "live")
            {
                completeURL = completeURL.Replace("https:", "http:");
            }

            // First, we need substract from the URL the QueryString to be
            // assigned to the WebClient object, avoiding problems while
            // manipulating the w.QueryString directly, and allowing both vias (url and data paramenter)
            // to set paramenters
            var uri = new Uri(completeURL);
            w.QueryString = HttpUtility.ParseQueryString(uri.Query);
            completeURL = uri.GetLeftPart(UriPartial.Path);

            if (data != null)
            foreach (var d in data)
            {
                // IMPORTANT: Expectation about the QueryString and WebClient was that they perform the correct
                // management of URL encoding for the given data, but it does nothing so needs to be manually done
                // using Uri.EscapeDataString to avoid bugs (fixed a bug at #965)
                w.QueryString.Add(d.Key, (Uri.EscapeDataString((d.Value ?? "").ToString())).ToString());
            }
            if (!w.QueryString.AllKeys.Contains<string>("RequestKey"))
                w.QueryString["RequestKey"] = SecurityRequestKey;

            try
            {
                rtn = w.DownloadString(completeURL);
            }
            catch (WebException exception)
            {
                string responseText = "";
                try
                {
                    using (var reader = new System.IO.StreamReader(exception.Response.GetResponseStream()))
                    {
                        responseText = reader.ReadToEnd();
                    }
                }
                catch { }
                string qs = GetWebClientQueryString(w);
                using (var logger = new LcLogger("SendMail"))
                {
                    logger.Log("Email ApplyTemplate URL:{0}", completeURL + qs);
                    logger.LogEx("Email ApplyTemplate exception (previous logged URL)", exception);
                    logger.LogData("Template web response: {0}", responseText);
                    logger.Save();
                }
                if (LcHelpers.InDev)
                {
                    HttpContext.Current.Trace.Warn("LcMessagging.ApplyTemplate", "Error creating template " + completeURL + qs, exception);
                    throw new Exception(exception.Message + "::" + responseText);
                }
                else
                {
                    NotifyError("LcMessaging.ApplyTemplate", completeURL + qs, responseText);
                    throw new Exception("Email could not be sent");
                }
            }
            catch (Exception ex)
            {
                using (var logger = new LcLogger("SendMail"))
                {
                    logger.Log("Email ApplyTemplate URL: {0}", completeURL + GetWebClientQueryString(w));
                    logger.LogEx("Email ApplyTemplate exception (previous logged URL)", ex);
                    logger.Save();
                }
                throw new Exception("Email could not be sent");
            }
            // Next commented line are test for another tries to get web content processed,
            // can be usefull test if someone have best performance than others, when need.
            //HttpContext.Current.Response.Output = null;
            //var o = new System.IO.StringWriter();
            //var r = new System.Web.Hosting.SimpleWorkerRequest(tplUrl, "", o);
            //Server.Execute()
            //System.Web.UI.PageParser.GetCompiledPageInstance
        }

        return rtn;
    }
    private static string GetWebClientQueryString(WebClient w)
    {
        string qs = "?";
        foreach (var v in w.QueryString.AllKeys)
        {
            qs += v + "=" + w.QueryString[v] + "&";
        }
        return qs;
    }
    internal static readonly string SecurityRequestKey = "abcd3";
    public static void SecureTemplate()
    {
        // Removed the extra check 'is live and is not local' because fails on Azure. Not sure
        // if something in the server set-up or that the template request and the requester runs
        // at different instances
        // Removed: (LcHelpers.InLive && !HttpContext.Current.Request.IsLocal)
        if (HttpContext.Current.Request["RequestKey"] != SecurityRequestKey)
            throw new HttpException(403, "Forbidden");
    }
    #endregion

    #region Send Mail wrapper function
    private static bool LogSuccessSendMail
    {
        get
        {
            try
            {
                return System.Configuration.ConfigurationManager.AppSettings["LogSuccessSendMail"] == "true";
            }
            catch
            {
                return false;
            }
        }
    }
    public static bool SendMail(string to, string subject, string body, string from = null, string replyTo = null)
    {
        // No mails for local development.
        if (LcHelpers.Channel == "localdev") return false;

        return SendMailNow(to, subject, body, from, replyTo: replyTo);
        //return ScheduleEmail(TimeSpan.FromMinutes(1), to, subject, body, from);
    }
    private static bool SendMailNow(string to, string subject, string body, string from = null, string replyTo = null)
    {
        try
        {
            WebMail.Send(to, subject, body, from, contentEncoding: "utf-8", replyTo: replyTo);

            if (LogSuccessSendMail)
            {
                using (var logger = new LcLogger("SendMail"))
                {
                    logger.Log("SUCCESS WebMail.Send, to:{0}, subject:{1}, from:{2}", to, subject, from);
                    logger.Save();
                }
            }
            return true;
        }
        catch (Exception ex) {
            using (var logger = new LcLogger("SendMail"))
            {
                logger.Log("WebMail.Send, to:{0}, subject:{1}, from:{2}, body::", to, subject, from);
                if (!String.IsNullOrEmpty(body)) {
                    logger.LogData(body);
                }
                else {
                    logger.Log("**There is no message body**");
                }
                logger.LogEx("SendMail (previous logged email)", ex);
                logger.Save();
            }
        }
        return false;
    }
    #endregion

    #region Email Scheduling
    /// <summary>
    /// Schedules an email to be sended after the delayTime especified.
    /// Technically, this method create a Cache event that expires after 3h, sending the email after that.
    /// 
    /// TODO: at the moment there is no fallback security, if the server stops or crashs for some reason
    /// the info might be lost, the event should be also stored in DDBB for manual/automated recovery
    /// in case of system failure.
    /// </summary>
    /// <param name="delayTime"></param>
    /// <param name="emailto"></param>
    /// <param name="emailsubject"></param>
    /// <param name="emailbody"></param>
    public static bool SendMailDelayed(TimeSpan delayTime, string emailto, string emailsubject, string emailbody, string from = null)
    {
        try
        {
            HttpContext.Current.Cache.Insert("ScheduledEmail: " + emailsubject,
                new Dictionary<string, string>()
                {
                    { "emailto", emailto },
                    { "emailsubject", emailsubject },
                    { "emailbody", emailbody },
                    { "emailfrom", from }
                },
                null,
                System.Web.Caching.Cache.NoAbsoluteExpiration, delayTime,
                CacheItemPriority.Normal,
                new CacheItemRemovedCallback(ScheduleEmailCacheItemRemovedCallback));

            return true;
        }
        catch
        {
            return false;
        }
    }
    /// <summary>
    /// Cache Callback that Sends the email
    /// </summary>
    /// <param name="key"></param>
    /// <param name="value"></param>
    /// <param name="reason"></param>
    static void ScheduleEmailCacheItemRemovedCallback(string key, object value, CacheItemRemovedReason reason)
    {
        try
        {
            Dictionary<string, string> emaildata = (Dictionary<string, string>)value;

            string emailto = emaildata["emailto"];
            string body = emaildata["emailbody"]; //"This is a test e-mail message sent using loconomics as a relay server ";
            string subject = emaildata["emailsubject"]; //"Loconomics test email";
            string from = emaildata["emailfrom"];

            SendMailNow(emailto, subject, body, from);

            // TODO: Test using the normal API for email sending, trying to solve current problem with
            // emails not being sent by this way:
            /*
                SmtpClient client = new SmtpClient("mail.loconomics.com", 25);
                client.EnableSsl = false;
                client.Credentials = new NetworkCredential("automated@loconomics.com", "Loconomic$2011");
                MailAddress from = new MailAddress(from);
                MailAddress to = new MailAddress(mail);
                MailMessage message = new MailMessage(from, to);
                client.SendAsync(message,"testing");
             */
        }
        catch (Exception ex)
        {
            if (HttpContext.Current != null)
                HttpContext.Current.Trace.Warn("LcMessaging.ScheduleEmail=>CacheItemRemovedCallback Error: " + ex.ToString());
            using (var logger = new LcLogger("SendMail"))
            {
                logger.LogEx("ScheduleEmail exception getting details from cache", ex);
                logger.Save();
            }
        }
    }
    #endregion
}