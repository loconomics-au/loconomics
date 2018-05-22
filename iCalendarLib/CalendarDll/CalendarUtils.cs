using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Ical.Net;
using Ical.Net.DataTypes;
using Ical.Net.Interfaces.DataTypes;
using Ical.Net.Serialization;
using Ical.Net.Serialization.iCalendar.Serializers;
using CalendarDll.Data;
using Ical.Net.Interfaces.Components;
using Ical.Net.Interfaces.Serialization;
using Ical.Net.Interfaces;

namespace CalendarDll
{
    /// <summary>
    /// Calendar Utils
    /// </summary>
    /// <remarks>2012/12/11 by CA2S (Static version), 2012/12/21 by RM (Dynamic version)</remarks>
    public class CalendarUtils
    {
        #region Calendar - Get an Instance


        /// <summary>
        /// Gets an Instance of the Calendar Library
        /// </summary>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public Calendar GetCalendarLibraryInstance() 
        {

            const string Calendar_VERSION = "2.0";

            Calendar newCalendar = 
                new Calendar()
                { 
                    Version = Calendar_VERSION 
                };

            return newCalendar;
        
        }


        #endregion

        #region Get Free Events



        /// <summary>
        /// Get Free Events
        /// 
        /// It includes both dates, full date times (not limited by the time in startDate and endDate)
        /// </summary>
        /// <param name="startDate"></param>
        /// <param name="endDate"></param>
        /// <param name="currentDateForAdvanceTime">Currend Date-Time for Calculating Advance Time.
        /// We consider the time BEFORE this parameter + Advance Time as unavailable.
        /// For two reasons: It is in the past, or we have to wait for the Advance Time to pass</param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public List<ProviderAvailabilityResult> GetFreeEvents(
            CalendarUser user,
            DateTimeOffset startDate,
            DateTimeOffset endDate,
            DateTimeOffset currentDateTimeForAdvanceTime) // currentDateTime is to add the Advance Time to
        {



            //----------------------------------------------------------------------
            // Time Slices Size (in Minutes)
            // That can be Free or Busy
            //----------------------------------------------------------------------


            const int TIME_SLICE_SIZE = 15; // in Minutes

            // IagoSRL: presaving the last date time slice (23:45:00 for a time_slice of 15) for later computations
            TimeSpan lastDayTimeSlice = new TimeSpan(24, 0, 0).Subtract(new TimeSpan(0, TIME_SLICE_SIZE, 0));


            //----------------------------------------------------------------------
            // For purposes of showing all the Time Slices of a day
            // we start on 0:00 AM and we end x minutes before the end of the day
            // (x minutes is the size of each Time Slice - see TIME_SLICE_SIZE above)
            //
            // What we do to get the endDate is 
            // Add a Day and then Subtract the Time Slice size
            //----------------------------------------------------------------------


            DateTimeOffset startDateTime = startDate;
            

            // To get to the Start of the last Time Slice of the day
            // First, it goes to the Next Day ( .AddDays(1) )
            // and then reverses by the size of the Time Slice
            // ( .AddMinutes(-TIME_SLICE_SIZE) )
            // We want to stop short of the TIME_SLICE_SIZE 
            // as this is the last iteration for all the Timeslices in the Date Range

            
            DateTimeOffset endDateTime = endDate.
                        AddDays(1).                   // Goes to the Next Day
                        AddMinutes(-TIME_SLICE_SIZE); // Goes back by the Time Slice size
            
            
            //----------------------------------------------------------------------
            // Advance Time
            //
            // The Providers (Users) have an Advance Time.
            // They aren't available for Jobs before that.
            // We calculate this non-available time from the Current Time on.
            //----------------------------------------------------------------------


            var advanceTime = 
                currentDateTimeForAdvanceTime + 
                user.AdvanceTime; 


            //----------------------------------------------------------------------


            List<DataContainer>        ldates     = new List<DataContainer>();
            var refDate = startDateTime;
            TimeSpan stamp   = new TimeSpan(0, 0, 0);

            //----------------------------------------------------------------------
            // new Calendar instance
            // filled with Events
            //----------------------------------------------------------------------

            // IagoSRL: using optimized methods
            //Calendar iCal = GetCalendarEventsFromDBByUserDateRange(user, startDate, endDate);
            Calendar iCal = OptimizedGetCalendarEventsFromDBByUserDateRange(user, startDate, endDate);


            //----------------------------------------------------------------------
            // Loop to generate all the Time Slices
            // for the Date Range
            //----------------------------------------------------------------------

            // Iago: Since we get calculated the last day time slice in endDateTime
            // previously, we need to check lower than or equal to don't lost that last
            // time slice, as previously happens by checking only 'less than'
            while (refDate <= endDateTime)
            {
                var newTimeSliceStart = 
                    refDate.AddMinutes(
                        TIME_SLICE_SIZE);

                ////----------------------------------------------------------------------
                //// REMARKED ORIGINAL LDATES.ADD 2013/01/03 CA2S RM
                //// I DID THIS TO REFACTOR IT,
                //// SO IT IS EASIER TO DEBUG LINE BY LINE
                //// INSTEAD OF DOING EVERYTHING IN A SINGLE LDATES.ADD
                //// IT BUILDS THE NECESSARY VALUES FIRST, AND THEN ADDS THEM TO LDATES
                ////----------------------------------------------------------------------

                //ldates.Add(

                //    (newTimeSliceStart <= advanceTime) ?

                //    new DataContainer() // Not Available because of Advance Time
                //    {
                //        Ocurrences = new List<Occurrence>(),
                //        TimeBlock = stamp,
                //        DT = refDate,
                //        AddBusyTime = new TimeSpan()
                //    } :

                //    new DataContainer() // Timeslices after Advance Time
                //    {
                //        Ocurrences = iCal.GetOccurrences(refDate, newTimeSliceStart),
                //        TimeBlock = stamp,
                //        DT = refDate,
                //        AddBusyTime = user.BetweenTime
                //    });

                //----------------------------------------------------------------------

                DataContainer tempDataContainer = new DataContainer();


                if (newTimeSliceStart <= advanceTime)
                {

                    // TimeSlice Not Available because it is inside of the Advance Time

                    tempDataContainer.Ocurrences = new HashSet<Occurrence>();
                    tempDataContainer.TimeBlock = stamp;
                    tempDataContainer.DT = refDate;
                    tempDataContainer.AddBusyTime = new TimeSpan();
                    
                }
                else
                {

                    // Timeslices after Advance Time

                    //----------------------------------------------------------------------
                    // iCal.GetOcurrence recovers the Ocurrences between two dates 
                    // but it is "INCLUSIVE these two dates"
                    //
                    // We want the events just before the ending date, 
                    // but NOT including the ending date.
                    //
                    // So, we did this Hack where 
                    // we subtract 1 Millisecond to the Ending Date
                    // 2013/01/02 CA2S RM
                    //----------------------------------------------------------------------

                    var TimeSliceEndJust1MillisecondBefore = 
                        newTimeSliceStart.AddMilliseconds(-1);

                    //----------------------------------------------------------------------
                    tempDataContainer.Ocurrences =
                        iCal.GetOccurrences(
                            new CalDateTime(refDate.UtcDateTime, "UTC"),
                            new CalDateTime(TimeSliceEndJust1MillisecondBefore.UtcDateTime, "UTC")
                        );
                    tempDataContainer.TimeBlock = stamp;
                    tempDataContainer.DT = refDate;
                    tempDataContainer.AddBusyTime = user.BetweenTime;
                }

                ldates.Add(tempDataContainer);


                //----------------------------------------------------------------------
                // Prepare for Next TimeSlice
                //----------------------------------------------------------------------


                refDate = newTimeSliceStart;


                //----------------------------------------------------------------------
                // If we are getting to the Last Time Slice of the Day
                // (24:00:00 minus the Time Slice size)
                // then we start anew from 00:00:00
                //----------------------------------------------------------------------

                stamp =
                    (stamp == lastDayTimeSlice) ?
                        stamp = new TimeSpan() :                         // Starting anew from 00:00:00 
                        stamp.Add(new TimeSpan(0, TIME_SLICE_SIZE, 0));  // Continue with next Time Slice


            }

            /* IagoSRL: one-step, don't waste iteration cycles!

            List<ProviderAvailability> ocurrences = new List<ProviderAvailability>();

            //----------------------------------------------------------------------
            // Gets the TimeSlices with Availability 
            // depending on the Ocurrences inside each TimeSlice
            //----------------------------------------------------------------------

            ocurrences =
                ldates.Select(
                    dts => new ProviderAvailability(dts)).ToList();

            //----------------------------------------------------------------------
            // Returns the Results
            //----------------------------------------------------------------------

            return ocurrences.
                        Select(av => av.result).ToList();
            */
            return ldates.Select(
                    dts => new ProviderAvailability(dts).result
            ).ToList();
        }


        #endregion

        #region Get the Calendar filled with the Events for the User


        /// <summary>
        /// Get the Calendar, filled with the Events for the User
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public Calendar GetCalendarEventsFromDBByUser(CalendarUser user)
        {

            Calendar iCal = GetCalendarLibraryInstance();

            iCal.Events.Clear();

            if (user != null)
            {
                foreach (var currEvent in GetEventsByUser(user))
                {
                    iCal.Events.Add(currEvent);
                }
            }

            return iCal;

        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="user"></param>
        /// <param name="startDate"></param>
        /// <param name="endDate"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public Calendar GetCalendarEventsFromDBByUserDateRange(
            CalendarUser user,
            DateTimeOffset startDate, 
            DateTimeOffset endDate)
        {
            if (user == null)
                throw new ArgumentNullException("user");

            return GetCalendarForEvents(GetEventsByUserDateRange(
                user, 
                startDate, 
                endDate));
        }

        public Calendar GetCalendarForEvents(IEnumerable<iEvent> events)
        {
            Calendar iCal = GetCalendarLibraryInstance();
            foreach (var ievent in events)
            {
                iCal.Events.Add(ievent);
            }
            return iCal;
        }

        public Calendar GetCalendarForEvents(IEnumerable<CalendarEvents> events)
        {
            Calendar iCal = GetCalendarLibraryInstance();
            foreach (var ievent in events)
            {
                iCal.Events.Add(CreateEvent(ievent));
            }
            return iCal;
        }


        /// <summary>
        /// Get Calendar Events, for Export, by User
        /// 
        /// It only takes into account the Events 
        /// with UIDs starting with Asterisk (*)
        /// </summary>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public Calendar GetCalendarByUserForExport(
            CalendarUser user)
        {
            Calendar iCalForExport = GetCalendarLibraryInstance();

            iCalForExport.Events.Clear();

            /* IagoSRL: We add some properties to the exported calendar for best interoperability
             * with other programs, some standard and some other not:
             */
            // By default, ical is Gregorian, but for best result be explicit
            iCalForExport.AddProperty("CALSCALE", "GREGORIAN");
            // Calendar name to display (Google Calendar property)
            iCalForExport.AddProperty("X-WR-CALNAME", "Loconomics");
            // Time Zone
            if (user.DefaultTimeZone != null)
            {
                // Calendar Time Zone information in standard format
                // used by objects contained in the file (events, vfreebusy..)
                var vt = new VTimeZone(user.DefaultTimeZone);
                iCalForExport.AddTimeZone(vt);
                // Default calendar TimeZone (Google Calendar property) -used for objets without 
                // a specific time-zone, but non standard-
                iCalForExport.AddProperty("X-WR-TIMEZONE", user.DefaultTimeZone);
            }
            

            if (user != null)
            {
                foreach (var currEvent in GetEventsByUserForExport(user, user.DefaultTimeZone))
                {
                    iCalForExport.Events.Add(currEvent);

                    /* IagoSRL: filtering per "*" removed because is now events are filtered by EventType
                     * that works better and more extensively, and has not the problem of events without saved GUID
                    // Only add Events that have an UID with a "*" in front
                    if (currEvent.UID.Length > 0 && 
                        currEvent.UID.Substring(0, 1) == "*")
                    {
                        iCalForExport.Events.Add(currEvent);
                    }
                    */
                }

            }

            return iCalForExport;
        }

        #endregion

        #region DateTime - Offsets - Timezone
        private Dictionary<string, NodaTime.DateTimeZone> cachedTimeZones = new Dictionary<string, NodaTime.DateTimeZone>();
        private NodaTime.DateTimeZone GetTimeZone(string tzid)
        {
            NodaTime.DateTimeZone timezone = NodaTime.DateTimeZone.Utc;
            if (cachedTimeZones.ContainsKey(tzid))
            {
                timezone = cachedTimeZones[tzid];
            }
            else
            {
                timezone = NodaTime.DateTimeZoneProviders.Tzdb.GetZoneOrNull(tzid) ?? timezone;
                cachedTimeZones.Add(tzid, timezone);
            }
            return timezone;
        }

        private CalDateTime CalDateTimeFromOffsetAndTimeZone(DateTimeOffset dto, string tzid)
        {
            var timezone = GetTimeZone(tzid);
            if (timezone == null) throw new Exception(String.Format("Time zone does not found ({0})", tzid));

            var zdt = NodaTime.Instant
                  .FromDateTimeOffset(dto)
                  .InZone(timezone);
            // Do this conversion very carefully: it's different to call the 'LocalDateTime' at the ZonedDateTime object
            // than in a DateTimeOffset, and CalDateDime expects a DateTime as the 'time as in that offset / offset' to be provided
            // with a tzid to manage date correctly; while a ZonedDateTime.LocalDateTime returns the date part 'as is' in the
            // object time zone, not in the 'system' time zone, so this one is what we want; BUT the DateTime object
            // must NOT include reference to the system time or UTC, must be of Kind.Unspecified, otherwise CalDateTime
            // will try some conversions from system time to offset or discard the tzid when is a Kind.UTC.
            return new CalDateTime(zdt.LocalDateTime.ToDateTimeUnspecified(), tzid);
        }
        #endregion

        #region Create Event (iCal Format, having the Loconomics DB Record)

        /// <summary>
        /// Create Event 
        /// 
        /// In iCal format, from the Loconomics DB
        /// </summary>
        /// <param name="eventFromDB"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public iEvent CreateEvent(
            CalendarDll.Data.CalendarEvents eventFromDB)
        {
            // Get TZID or fallback in UTC. Process properly the datetimes stored, they include offset so we can get it's offseted datetime
            // and left CalDateTime to process it as in the appropiated time zone.
            var tzid = eventFromDB.TimeZone;
            var hasTz = !String.IsNullOrEmpty(tzid);
            if (!hasTz)
            {
                tzid = "UTC";
            }

            var eventStart = CalDateTimeFromOffsetAndTimeZone(eventFromDB.StartTime, tzid);
            var eventEnd = CalDateTimeFromOffsetAndTimeZone(eventFromDB.EndTime, tzid);
            var eventRecurrenceId = eventFromDB.RecurrenceId.HasValue ? CalDateTimeFromOffsetAndTimeZone(eventFromDB.RecurrenceId.Value, tzid) : null;
            // DTStamp, per iCalendar standard, "MUST be in UTC"
            // It represents the creation of the VEVENT record.
            var eventStamp = CalDateTimeFromOffsetAndTimeZone(eventFromDB.StampTime ?? DateTimeOffset.UtcNow, "UTC");

            iEvent iCalEvent = new iEvent
            {
                Summary = eventFromDB.Summary ?? null,
                Start = eventStart,
                //Duration = (eventFromDB.EndTime - eventFromDB.StartTime),
                End = eventEnd,
                Location = eventFromDB.Location ?? null,
                AvailabilityID = eventFromDB.CalendarAvailabilityTypeID,
                EventType = eventFromDB.EventType,
                IsAllDay = eventFromDB.IsAllDay,
                Status = GetEventStatus(eventFromDB.CalendarAvailabilityTypeID),
                Priority = eventFromDB.Priority ?? 0,
                Uid = (string.IsNullOrEmpty(eventFromDB.UID)) ? "*" + Guid.NewGuid().ToString() + "@loconomics.com" : eventFromDB.UID,
                Class = eventFromDB.Class,
                Organizer = eventFromDB.Organizer != null ? new Organizer(eventFromDB.Organizer) : null,
                Transparency = (TransparencyType)(eventFromDB.Transparency ? 1 : 0),
                Created      = CalDateTimeFromOffsetAndTimeZone(eventFromDB.CreatedDate ?? DateTime.Now, "UTC"),
                DtEnd        = eventEnd,
                DtStamp      = eventStamp,
                DtStart      = eventStart,
                LastModified = CalDateTimeFromOffsetAndTimeZone(eventFromDB.UpdatedDate ?? DateTime.Now, "UTC"),
                Sequence = eventFromDB.Sequence ?? 0,
                RecurrenceId = eventRecurrenceId,
                GeographicLocation = eventFromDB.Geo != null    ? new GeographicLocation(eventFromDB.Geo) : null/*"+-####;+-####"*/,
                Description = eventFromDB.Description ?? null
            };


            //----------------------------------------------------------------------
            // Additional Processing
            //----------------------------------------------------------------------


            FillExceptionsDates( iCalEvent, eventFromDB, tzid);
            FillRecurrencesDates(iCalEvent, eventFromDB, tzid);
            FillContacts(        iCalEvent, eventFromDB);
            FillAttendees(       iCalEvent, eventFromDB);
            FillComments(        iCalEvent, eventFromDB);
            FillRecurrences(     iCalEvent, eventFromDB);


            //----------------------------------------------------------------------

            return iCalEvent;
        }


        #endregion

        #region Create Between Events


        /// <summary>
        /// Create Between Events
        /// 
        /// It takes the Original iCal Event
        /// and creates another iCal Event 
        /// following the original, 
        /// and with the duration of the Between Event of the User
        /// </summary>
        /// <param name="originalICalEvent"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA</remarks>
        private iEvent CreateBetweenEvent(iEvent originalICalEvent,CalendarUser user)
        {
            //CultureInfo.CreateSpecificCulture("es-ES");
            var resources = 
                new System.Resources.ResourceManager(
                    typeof(CalendarDll.Resources));

            string descriptionBetweenTime =
                resources.GetString(
                    "BetweenTime",
                    System.Threading.Thread.CurrentThread.CurrentCulture); // "Between Time" - Localized

            iEvent events = new iEvent()
            {

                Summary = descriptionBetweenTime,
                Uid = "*" + Guid.NewGuid().ToString(), // * at the start dennotes a Loconomics (not external) Event
                Start = 
                    originalICalEvent.DtEnd,
                Duration = 
                    user.BetweenTime,
                AvailabilityID = 
                    originalICalEvent.AvailabilityID,
                Status = 
                    originalICalEvent.Status,
                Priority = 
                    originalICalEvent.Priority,
                Description = 
                    originalICalEvent.Description + " - " + descriptionBetweenTime,
                Organizer = 
                    originalICalEvent.Organizer,
                Transparency = 
                    originalICalEvent.Transparency,
                Created = 
                    originalICalEvent.Created,
                DtStamp = 
                    originalICalEvent.DtEnd,
                DtStart = 
                    originalICalEvent.DtEnd,
                DtEnd = 
                    originalICalEvent.DtEnd.Add(user.BetweenTime),
                Sequence = 
                    originalICalEvent.Sequence,
                RecurrenceId = 
                    originalICalEvent.RecurrenceId,
                //RecurrenceRules = evt.RecurrenceRules,

            };

            //----------------------------------------------------------------------
            // If there are Recurrence Rules in the Original
            // add them to the "Between Event" too
            //----------------------------------------------------------------------

            foreach(var a in originalICalEvent.RecurrenceRules)
                events.RecurrenceRules.Add(a);

            //----------------------------------------------------------------------

            return events;
        }


        #endregion

        #region Get Event Status


        /// <summary>
        /// Get Event Status
        /// </summary>
        /// <param name="statusID"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private EventStatus GetEventStatus(int statusID)
        {

            //TODO
            //
            //  Tentative = 0,
            //  Confirmed = 1,
            //  Cancelled = 2,
            //
            //cancelled excluded

            if (statusID == 3) return EventStatus.Tentative;
            else if (statusID == 1 || statusID == 4) return EventStatus.Confirmed;
            else if (statusID == 2 || statusID == 0) return EventStatus.Confirmed;

            return EventStatus.Confirmed;

        }

        #endregion

        #region Get Transparency


        /// <summary>
        /// Get Transparency
        /// </summary>
        /// <param name="eventStatus"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA</remarks>
        private static bool getTransparency(int eventStatus)
        {
            if (eventStatus == 0) return true;
            return false;
        }


        #endregion

        #region Get Availability Id

        private int getAvailabilityId(Event currEvent)
        {
            var Status = currEvent.Status;
            var Transparency = currEvent.Transparency;

           
            if (Transparency == null) Transparency = TransparencyType.Opaque;


            var returnValue = AvailabilityTypes.TRANSPARENT;

            if (Transparency == TransparencyType.Transparent)
            {
                returnValue = AvailabilityTypes.TRANSPARENT;
            }
            else 
            {

                switch (Status)
                {
                    case EventStatus.Confirmed:
                        {
                            returnValue = AvailabilityTypes.BUSY; 
                            break;
                        }
                    case EventStatus.Tentative:
                        {
                            returnValue = AvailabilityTypes.TENTATIVE;
                            break;
                        }
                    case EventStatus.Cancelled:
                        {
                            returnValue = AvailabilityTypes.TRANSPARENT;
                            break;
                        }
                    default:
                        {
                            returnValue = AvailabilityTypes.TENTATIVE;
                            break;
                        }
                } 

            } 
            return (Int32)returnValue;
        }

        /// <summary>
        /// Get the Database AvailabilityID based on the 
        /// FreeBusyEntry status, that has one-to-one equivalencies
        /// </summary>
        /// <param name="fbentry"></param>
        /// <returns></returns>
        /// <remarks>IagoSRL 2013/05/08</remarks>
        private AvailabilityTypes getAvailabilityId(IFreeBusyEntry fbentry)
        {
            switch (fbentry.Status)
            {
                case FreeBusyStatus.Free:
                    return AvailabilityTypes.FREE;
                default:
                case FreeBusyStatus.Busy:
                    return AvailabilityTypes.BUSY;
                case FreeBusyStatus.BusyTentative:
                    return AvailabilityTypes.TENTATIVE;
                case FreeBusyStatus.BusyUnavailable:
                    return AvailabilityTypes.UNAVAILABLE;
            }
        }


        /// <summary>
        /// Get Availability Id
        /// </summary>
        /// <param name="eventStatus"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private int getAvailabilityId(
            int eventStatus)
        {


            if (eventStatus == 0) { 
                return 4; 
            }
            
            
            return 2;

        }

        /// <summary>
        /// Availabilty when Importing
        /// 
        /// It calculates the Availability
        /// depending on the Status (which could be Confirmed, Tentative, Cancelled)
        /// and the Transparency (which could be Opaque or Transparent)
        /// </summary>
        /// <param name="Status"></param>
        /// <param name="Transparency"></param>
        /// <returns></returns>
        /// <remarks>2013/01/02 CA2S RM</remarks>
        private int getAvailabilityId(string Status, string Transparency)
        {

            // Event Availability (Return Values)
            // (See table: CalendarAvailabilityType)
            //
            //const Int32 AVAILABILITY_UNAVAILABLE = 0;
            const Int32 AVAILABILITY_FREE        = 1;
            const Int32 AVAILABILITY_BUSY        = 2;
            const Int32 AVAILABILITY_TENTATIVE   = 3;
            const Int32 AVAILABILITY_TRANSPARENT = 4;

            const string TRANSPARENCY_OPAQUE      = "OPAQUE";
            const string TRANSPARENCY_TRANSPARENT = "TRANSPARENT";

            const string STATUS_CONFIRMED = "CONFIRMED";
            const string STATUS_TENTATIVE = "TENTATIVE";
            const string STATUS_CANCELLED = "CANCELLED";


            //----------------------------------------------------------------------
            // Clean Up of Parameters
            //----------------------------------------------------------------------


            Status = Status.Trim().ToUpper();
            Transparency = Transparency.Trim().ToUpper();


            //----------------------------------------------------------------------
            // Default Values for the Parameters
            //----------------------------------------------------------------------

            if (Status == "") 
            {
                Status = STATUS_CONFIRMED;
            }

            if (Transparency == "") 
            {
                Transparency = TRANSPARENCY_OPAQUE;
            }


            ////----------------------------------------------------------------------
            //// If Both Parameters are empty
            ////----------------------------------------------------------------------

            //if ((Status=="") && (Transparency==""))
            //{
            //    return 2; // 2 == Busy            
            //}

            ////----------------------------------------------------------------------
            //// If Status Parameter is empty
            ////----------------------------------------------------------------------

            //if ((Status == "") && (Transparency != "")) 
            //{

            //    if (Transparency == "")
            //    {

            //    }
            //    else
            //    {

            //    }
            //}


            //----------------------------------------------------------------------
            // Default Value for the Return Value: Transparent 
            // (Doesn't take part in Free/Busy calculations)
            //----------------------------------------------------------------------


            Int32 returnValue = AVAILABILITY_TRANSPARENT;


            //----------------------------------------------------------------------
            // Check which Combination of Parameters applies
            //----------------------------------------------------------------------

            if (Transparency == TRANSPARENCY_OPAQUE) 
            {

                switch (Status) 
                {
                    case STATUS_CONFIRMED: { 
                        returnValue = AVAILABILITY_BUSY;
                        break;
                    }
                    case STATUS_TENTATIVE: { 
                        returnValue = AVAILABILITY_TENTATIVE;
                        break;
                    }
                    case STATUS_CANCELLED: { 
                        returnValue = AVAILABILITY_TRANSPARENT;
                        break;
                    }

                } // switch (Status)
            
            }
            else if (Transparency == TRANSPARENCY_TRANSPARENT)
            {

                switch (Status) 
                {
                    case STATUS_CONFIRMED: { 
                        returnValue = AVAILABILITY_FREE;
                        break;
                    }
                    case STATUS_TENTATIVE: { 
                        // Case Free, but Tentative - Don't take part in calculations
                        returnValue = AVAILABILITY_TRANSPARENT;
                        break;
                    }
                    case STATUS_CANCELLED: { 
                        // Case Free, but Cancelled - Don't take part in calculations
                        returnValue = AVAILABILITY_TRANSPARENT;
                        break;
                    }

                } // switch (Status)

            } // else if (Transparency == TRANSPARENCY_TRANSPARENT)


            //----------------------------------------------------------------------
            // Return Value
            //----------------------------------------------------------------------

            return returnValue;

        }


        #endregion

        #region Get Events by User


        /// <summary>
        /// Get Events by User
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private IEnumerable<iEvent> GetEventsByUser(CalendarUser user)
        {

            using (var db = new CalendarDll.Data.loconomicsEntities()) 
            { 
            
                var listEventsFromDB =
                    db.CalendarEvents.
                        Where(c => c.UserId == user.Id && c.Deleted == null).ToList();

                var iCalEvents = new List<iEvent>();

                foreach (var currEventFromDB in listEventsFromDB)
                {
                    var iCalEvent = CreateEvent(currEventFromDB);

                    iCalEvents.Add(iCalEvent);

                    //----------------------------------------------------------------------
                    // If the Event is a Busy Event
                    // that is Work of a Provider,
                    // it adds a "Between Time" or buffer time
                    // so that the next Job is not completely next in the Calendar.
                    //
                    // This is to give some preparation or transportation time
                    // between Jobs to the Provider
                    //----------------------------------------------------------------------

                    //----------------------------------------------------------------------
                    // Event types
                    //----------------------------------------------------------------------
                    //
                    // 1	booking - GENERATES BETWEEN TIME
                    // 2	work hours
                    // 3	availibility events
                    // 4	imported
                    // 5	other
                    //
                    //----------------------------------------------------------------------


                    if (iCalEvent.EventType == 1)
                    {
                        var evExt = CreateBetweenEvent(iCalEvent,user);
                        iCalEvents.Add(evExt);
                    }

                    //var newEv = CreateEvent(c);
                    //yield return newEv;

                    //----------------------------------------------------------------------

                }     
                return iCalEvents;
            }
        }
        /// <summary>
        /// Based on GetEventsByUser, it filter events by type to only that required in
        /// the export task.
        /// </summary>
        /// <param name="user"></param>
        /// <param name="defaultTZID"></param>
        /// <returns></returns>
        /// <remarks>IagoSRL</remarks>
        private IEnumerable<iEvent> GetEventsByUserForExport(CalendarUser user, string defaultTZID)
        {
            using (var db = new CalendarDll.Data.loconomicsEntities()) 
            { 
                var listEventsFromDB =
                    db.CalendarEvents.
                        // We filter by user and
                        Where(c => c.UserId == user.Id && c.Deleted == null &&
                            // By type NOT being free-hours (2) or imported (4). Commented on issue #228 2013-05-13
                            !(new int[]{2, 4}).Contains(c.EventType)).ToList();

                var iCalEvents = new List<iEvent>();

                foreach (var currEventFromDB in listEventsFromDB)
                {
                    var iCalEvent = CreateEvent(currEventFromDB);

                    iCalEvents.Add(iCalEvent);

                    /* As requested by Josh on issue #228 2013-05-11
                     * we don't want now the 'buffer event' be exported
                    if (iCalEvent.EventType == 1)
                    {
                        var evExt = CreateBetweenEvent(iCalEvent,user);
                        iCalEvents.Add(evExt);
                    }*/
                }     
                return iCalEvents;
            }
        }

        /// <summary>
        /// Get Events By User
        /// (overloads another version without Dates parameters)
        /// 
        /// And also by Range of Dates
        /// Note: Because recurrence events are more complicated,
        /// they are recovered regardless of dates
        /// </summary>
        /// <param name="user"></param>
        /// <param name="startEvaluationDate"></param>
        /// <param name="endEvaluationDate"></param>
        /// <returns></returns>
        /// <remarks>2012/12 by CA2S FA</remarks>
        public IEnumerable<iEvent> GetEventsByUserDateRange(
            CalendarUser user, 
            DateTimeOffset startEvaluationDate, 
            DateTimeOffset endEvaluationDate)
        {

            // For the Ending of the Range
            // We'll get the Next Day
            // And the comparisson will be: Less than this Next Day
            DateTimeOffset nextDayFromEndEvaluationDay = 
                endEvaluationDate.Date.AddDays(1);


            using (var db = new CalendarDll.Data.loconomicsEntities()) 
            { 
            
            
                // Recovers Events 
                // for a particular User
                // and a particular Date Range
                // OR, if they are Recurrence, any Date Range
                var listEventsFromDB =
                    db.CalendarEvents.Where(
                        c => c.UserId == user.Id && c.Deleted == null &&
                        (
                            // IagoSRL: Date Ranges query updated from being
                            // 'only events that are completely included' (next commented code from CASS):
                            //(c.EndTime < nextDayFromEndEvaluationDay && 
                            //c.StartTime >=startEvaluationDate) || 
                        
                            // to be 'all events complete or partially inside the range: complete included or with a previous
                            // start or with a posterior end'.
                            // This fix a bug found on #463 described on comment https://github.com/joshdanielson/Loconomics/issues/463#issuecomment-36936782 and nexts.
                            (
                                c.StartTime < nextDayFromEndEvaluationDay && 
                                c.EndTime >= startEvaluationDate
                            ) || 
                            // OR, if they are Recurrence, any Date Range
                            c.CalendarReccurrence.Any()
                        )
                    ).ToList();

                foreach (var currEventFromDB in listEventsFromDB)
                {
                    var iCalEvent = CreateEvent(currEventFromDB);

                    yield return iCalEvent;

                    //----------------------------------------------------------------------
                    // If the Event is a Busy Event
                    // that is Work of a Provider,
                    // it adds a "Between Time" or buffer time
                    // so that the next Job is not completely next in the Calendar.
                    //
                    // This is to give some preparation or transportation time
                    // between Jobs to the Provider
                    //----------------------------------------------------------------------

                    //----------------------------------------------------------------------
                    // Event types
                    //----------------------------------------------------------------------
                    //
                    // 1	booking - GENERATES BETWEEN TIME
                    // 2	work hours
                    // 3	availibility events
                    // 4	imported
                    // 5	other
                    //
                    //----------------------------------------------------------------------

                    if (iCalEvent.EventType == 1 &&
                        user.BetweenTime > TimeSpan.Zero)
                    {
                        yield return CreateBetweenEvent(iCalEvent,user);
                    }

                    //var newEv = CreateEvent(c);
                    //yield return newEv;

                    //----------------------------------------------------------------------

                } 
            
            }

        }

        #endregion

        #region IAGO: New, faster, optimized fetch event and occurrences (don't fetch unneeded data, use SQL, time filtering, faster)

        /// <summary>
        /// Create Event 
        /// 
        /// In iCal format, from the Loconomics DB
        /// </summary>
        /// <param name="eventFromDB"></param>
        /// <returns></returns>
        /// <remarks>2015-09 by iago</remarks>
        public iEvent OptimizedCreateEvent(
            CalendarDll.Data.CalendarEvents eventFromDB,
            System.Data.Entity.DbContext db)
        {
            // Get TZID or fallback in UTC. Process properly the datetimes stored, they include offset so we can get it's offseted datetime
            // and left CalDateTime to process it as in the appropiated time zone.
            var tzid = eventFromDB.TimeZone;
            var hasTz = !String.IsNullOrEmpty(tzid);
            if (!hasTz)
            {
                tzid = "UTC";
            }

            var eventStart = CalDateTimeFromOffsetAndTimeZone(eventFromDB.StartTime, tzid);
            var eventEnd = CalDateTimeFromOffsetAndTimeZone(eventFromDB.EndTime, tzid);
            var eventRecurrenceId = eventFromDB.RecurrenceId.HasValue ? CalDateTimeFromOffsetAndTimeZone(eventFromDB.RecurrenceId.Value, tzid) : null;
            // DTStamp, per Calendar standard, "MUST be in UTC"
            // It represents the creation of the VEVENT record.
            var eventStamp = CalDateTimeFromOffsetAndTimeZone(eventFromDB.StampTime ?? DateTime.UtcNow, "UTC");

            iEvent iCalEvent = new iEvent()
            {
                Summary = eventFromDB.Summary ?? null,
                Start = eventStart,
                //Duration = (eventFromDB.EndTime - eventFromDB.StartTime),
                End = eventEnd,
                Location = eventFromDB.Location ?? null,
                AvailabilityID = eventFromDB.CalendarAvailabilityTypeID,
                EventType = eventFromDB.EventType,
                IsAllDay = eventFromDB.IsAllDay,
                Status = GetEventStatus(eventFromDB.CalendarAvailabilityTypeID),
                Priority = eventFromDB.Priority ?? 0,
                Uid = (string.IsNullOrEmpty(eventFromDB.UID)) ? "*" + Guid.NewGuid().ToString() + "@loconomics.com" : eventFromDB.UID,
                Class = eventFromDB.Class,
                Organizer = eventFromDB.Organizer != null ? new Organizer(eventFromDB.Organizer) : null,
                Transparency = (TransparencyType)(eventFromDB.Transparency ? 1 : 0),
                Created = CalDateTimeFromOffsetAndTimeZone(eventFromDB.CreatedDate ?? DateTime.Now, "UTC"),
                DtEnd = eventEnd,
                DtStamp = eventStamp,
                DtStart = eventStart,
                LastModified = CalDateTimeFromOffsetAndTimeZone(eventFromDB.UpdatedDate ?? DateTime.Now, "UTC"),
                Sequence = eventFromDB.Sequence ?? 0,
                RecurrenceId = eventRecurrenceId,
                GeographicLocation = eventFromDB.Geo != null ? new GeographicLocation(eventFromDB.Geo) : null/*"+-####;+-####"*/,
                Description = eventFromDB.Description ?? null
            };


            // Additional data loading, references
            eventFromDB.CalendarEventExceptionsPeriodsList = db.Database.SqlQuery<CalendarEventExceptionsPeriodsList>("SELECT * FROM CalendarEventExceptionsPeriodsList WHERE IdEvent = {0}", eventFromDB.Id).ToList();
            eventFromDB.CalendarEventRecurrencesPeriodList = db.Database.SqlQuery<CalendarEventRecurrencesPeriodList>("SELECT * FROM CalendarEventRecurrencesPeriodList WHERE IdEvent = {0}", eventFromDB.Id).ToList();
            eventFromDB.CalendarReccurrence = db.Database.SqlQuery<CalendarReccurrence>("SELECT * FROM CalendarReccurrence WHERE EventID = {0}", eventFromDB.Id).ToList();

            foreach (var r in eventFromDB.CalendarEventExceptionsPeriodsList)
            {
                r.CalendarEventExceptionsPeriod = db.Database.SqlQuery<CalendarEventExceptionsPeriod>("SELECT * FROM CalendarEventExceptionsPeriod WHERE IdException = {0}", r.Id).ToList();
            }
            foreach (var r in eventFromDB.CalendarEventRecurrencesPeriodList)
            {
                r.CalendarEventRecurrencesPeriod = db.Database.SqlQuery<CalendarEventRecurrencesPeriod>("SELECT * FROM CalendarEventRecurrencesPeriod WHERE IdRecurrence = {0}", r.Id).ToList();
            }

            //----------------------------------------------------------------------
            // Additional Processing
            //----------------------------------------------------------------------


            FillExceptionsDates(iCalEvent, eventFromDB, tzid);
            FillRecurrencesDates(iCalEvent, eventFromDB, tzid);
            FillRecurrences(iCalEvent, eventFromDB);
            // Unneeded, commented out (we just want times, occurrences, not meta data records)
            //FillContacts(        iCalEvent, eventFromDB);
            //FillAttendees(       iCalEvent, eventFromDB);
            //FillComments(        iCalEvent, eventFromDB);

            //----------------------------------------------------------------------

            return iCalEvent;
        }

        public Calendar OptimizedGetCalendarEventsFromDBByUserDateRange(
            CalendarUser user,
            DateTimeOffset startDate,
            DateTimeOffset endDate)
        {
            if (user == null)
                throw new ArgumentNullException("user");

            return GetCalendarForEvents(OptimizedGetEventsByUserDateRange(
                user,
                startDate,
                endDate));
        }

        /// <summary>
        /// Get Events By User and by Range of Dates
        /// Note: Because recurrence events are more complicated,
        /// they are recovered regardless of dates
        /// </summary>
        /// <param name="user"></param>
        /// <param name="startEvaluationDate">Included (more than or equals)</param>
        /// <param name="endEvaluationDate">Excluded (less than)</param>
        /// <returns></returns>
        /// <remarks>2015-09 Iago</remarks>
        public IEnumerable<iEvent> OptimizedGetEventsByUserDateRange(
            CalendarUser user,
            DateTimeOffset startEvaluationDate,
            DateTimeOffset endEvaluationDate)
        {
            using (var db = new CalendarDll.Data.loconomicsEntities())
            {
                // Recovers Events 
                // for a particular User
                // and a particular Date Range
                // OR, if they are Recurrence, any Date Range (cannot be filtered out at database)
                // Filtering is 'all events complete or partially inside the range: complete included or with a previous
                // start or with a posterior end'.
                // As of #463, comment https://github.com/joshdanielson/Loconomics/issues/463#issuecomment-36936782 and nexts.
                var listEventsFromDB = db.Database.SqlQuery<CalendarEvents>(@"
                    SELECT [Id]
                          ,[UserId]
                          ,[EventType]
                          ,[Summary]
                          ,[UID]
                          ,[CalendarAvailabilityTypeID]
                          ,[Transparency]
                          ,[StartTime]
                          ,[EndTime]
                          ,[IsAllDay]
                          ,[StampTime]
                          ,[TimeZone]
                          ,[Priority]
                          ,[Location]
                          ,[UpdatedDate]
                          ,[CreatedDate]
                          ,[ModifyBy]
                          ,[Class]
                          ,[Organizer]
                          ,[Sequence]
                          ,[Geo]
                          ,[RecurrenceId]
                          ,[TimeBlock]
                          ,[DayofWeek]
                          ,[Description]
                          ,[Deleted]
                      FROM [CalendarEvents]
                    WHERE userId = {2} AND (
                        (StartTime < {0} AND EndTime >= {1})
                        OR EXISTS (SELECT id from CalendarReccurrence AS R where R.EventID = CalendarEvents.Id)
                    ) AND Deleted is null
                ", endEvaluationDate, startEvaluationDate, user.Id);

                foreach (var currEventFromDB in listEventsFromDB)
                {
                    // IT LOADS RELATED DATA TOO, like recurrence
                    // MUST BE BEFORE the CreateBetweenEvent (but can be yielded later if order must change,
                    // with change on CreateBetweenEvent on where time is applied; right now is after)
                    var iCalEvent = OptimizedCreateEvent(currEventFromDB, db);

                    yield return iCalEvent;

                    //----------------------------------------------------------------------
                    // If the Event is a Busy Event
                    // that is Work of a Provider,
                    // it adds a "Between Time" or buffer time
                    // so that the next Job is not completely next in the Calendar.
                    //
                    // This is to give some preparation or transportation time
                    // between Jobs to the Provider
                    //----------------------------------------------------------------------

                    //----------------------------------------------------------------------
                    // Event types
                    //----------------------------------------------------------------------
                    //
                    // 1	booking - GENERATES BETWEEN TIME
                    // 2	work hours
                    // 3	availibility events
                    // 4	imported
                    // 5	other
                    //
                    //----------------------------------------------------------------------

                    if (iCalEvent.EventType == 1 &&
                        user.BetweenTime > TimeSpan.Zero)
                    {
                        yield return CreateBetweenEvent(iCalEvent, user);
                    }

                    //var newEv = CreateEvent(c);
                    //yield return newEv;

                    //----------------------------------------------------------------------

                }
            }
        }

        /// <summary>
        /// Represents a slot of time (a range of two dates)
        /// for a type of availability.
        /// </summary>
        public class AvailabilitySlot
        {
            public DateTimeOffset StartTime;
            public DateTimeOffset EndTime;
            public int AvailabilityTypeID;
            public override bool Equals(object obj)
            {
                var other = obj as AvailabilitySlot;
                if (other != null)
                {
                    return StartTime == other.StartTime && EndTime == other.EndTime && AvailabilityTypeID == other.AvailabilityTypeID;
                }
                return false;
            }
        }

        /// <summary>
        /// Compute the occurrences of all events, normal and recurrents, from the filled in Calendar given between the dates
        /// as of the internal logic of the Calendar component.
        /// Results are in UTC
        /// </summary>
        /// <param name="ical"></param>
        /// <param name="startTime"></param>
        /// <param name="endTime"></param>
        /// <returns></returns>
        public IEnumerable<AvailabilitySlot> GetEventsOccurrencesInAvailabilitySlotsUtc(Calendar ical, DateTimeOffset startTime, DateTimeOffset endTime)
        {
            // IMPORTANT: The GetOccurrences API discards the time part of the passed datetimes, it means that the endtime
            // gets discarded, to be included in the results we need to add almost 1 day to the value.
            // In the loop, we filter out occurrences out of the original endTime limit
            var queryEndTime = endTime.AddDays(1);

            foreach (var ev in ical.Events)
            {
                foreach (var occ in ev.GetOccurrences(startTime.UtcDateTime, queryEndTime.UtcDateTime))
                {
                    var slotStart = new DateTimeOffset(occ.Period.StartTime.AsUtc, TimeSpan.Zero);
                    var slotEnd = new DateTimeOffset(occ.Period.EndTime.AsUtc, TimeSpan.Zero);
                    // Filter out occurrences out of the original endTime
                    if (slotStart >= endTime)
                    {
                        continue;
                    }
                    yield return new AvailabilitySlot {
                        StartTime = slotStart,
                        EndTime = slotEnd,
                        AvailabilityTypeID = ((iEvent)occ.Period.StartTime.AssociatedObject).AvailabilityID
                    };
                }
            }
        }

        public DateTimeOffset DateTimeOffsetFromCalDateTime(IDateTime time)
        {
            var utc = new DateTimeOffset(time.AsUtc, TimeSpan.Zero);
            var zone = String.IsNullOrEmpty(time.TimeZoneName) ? null : GetTimeZone(time.TimeZoneName);
            if (zone == null)
            {
                return utc;
            }
            else
            {
                return NodaTime.ZonedDateTime.FromDateTimeOffset(utc).WithZone(zone).ToDateTimeOffset();
            }
        }

        public IEnumerable<AvailabilitySlot> SortDateRange(IEnumerable<AvailabilitySlot> dateRanges)
        {
            return dateRanges.OrderBy(dr => dr.StartTime);
        }

        /// <summary>
        /// For the given user and included in the given dates, returns all the
        /// availability slots for the computed event occurrences, complete or partial.
        /// Results are event occurrences in the format of availability slots, so overlapping of
        /// slots will happen, and holes. Results are sorted by start time.
        /// Another method must perform the computation of put all this slots in a single, consecutive
        /// and complete timeline, where some availabilities takes precedence over others to don't have overlapping.
        /// Results may include slots that goes beyond the given filter dates, but it ensures that all that, partial or complete
        /// happens in that dates will be returned.
        /// 
        /// Resulting dates are given in UTC.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="startTime">Included (more than or equals)</param>
        /// <param name="endTime">Excluded (less than)</param>
        /// <returns></returns>
        public IEnumerable<AvailabilitySlot> GetEventsOccurrencesInUtcAvailabilitySlotsByUser(int userID, DateTimeOffset startTime, DateTimeOffset endTime)
        {
            // We need an Calendar to include events and being able to compute occurrences
            Calendar data = GetCalendarLibraryInstance();
            var events = OptimizedGetEventsByUserDateRange(new CalendarUser(userID), startTime, endTime);
            foreach (var ievent in events)
                data.Events.Add(ievent);

            var occurrences = GetEventsOccurrencesInAvailabilitySlotsUtc(data, startTime, endTime).OrderBy(dr => dr.StartTime);

            return occurrences;
        }
        #endregion

        #region Fill Exceptions Dates



        /// <summary>
        /// Fill Exceptions Dates
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillExceptionsDates(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB,
            string defaultTZID)
        {
            var tzid = defaultTZID ?? "UTC";
            var exceptionDates = 
                eventFromDB.CalendarEventExceptionsPeriodsList;

            if (!exceptionDates.Any()) 
            { 
                return; 
            }

            var periodsList = new List<PeriodList>();

            foreach (var prd in exceptionDates)
            {
                var period = new PeriodList();
                foreach (var dates in prd.CalendarEventExceptionsPeriod)
                {
                    if (dates.DateEnd.HasValue)
                        period.Add(
                            new Period(
                                CalDateTimeFromOffsetAndTimeZone(dates.DateStart, tzid),
                                CalDateTimeFromOffsetAndTimeZone(dates.DateEnd.Value, tzid)));
                    else
                        period.Add(
                            new Period(
                                CalDateTimeFromOffsetAndTimeZone(dates.DateStart, tzid)));
                }
                iCalEvent.ExceptionDates.Add(period);
            }
        }


        private void FillExceptionsDatesToDB(Event iCalEvent, CalendarDll.Data.CalendarEvents eventForDB)
        {
            var exceptionDates = iCalEvent.ExceptionDates;

            if (!exceptionDates.Any())
            {
                return;
            }

            var periodsList = new List<PeriodList>();
            var periods = new CalendarEventExceptionsPeriodsList();

            foreach (var prd in exceptionDates)
            {
                foreach (var dates in prd)
                {
                    periods.CalendarEventExceptionsPeriod.Add(new CalendarEventExceptionsPeriod()
                    {
                        DateStart = new DateTimeOffset(dates.StartTime.AsUtc, TimeSpan.Zero),
                        DateEnd = dates.EndTime != null ? (DateTimeOffset?)new DateTimeOffset(dates.EndTime.AsUtc, TimeSpan.Zero) : null,
                    });
                }
            }
            eventForDB.CalendarEventExceptionsPeriodsList.Add(periods);
        }

        #endregion

        #region Fill Recurrence Dates



        /// <summary>
        /// Fill Recurrence Dates
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillRecurrencesDates(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB,
            string defaultTZID)
        {
            var tzid = defaultTZID ?? "UTC";
            var recurrenceDates = 
                eventFromDB.CalendarEventRecurrencesPeriodList;
            
            if (!recurrenceDates.Any())   return; 

            var periodsList = new List<PeriodList>();

            foreach (var prd in recurrenceDates)
            {
                var period = new PeriodList();

                foreach (var dates in prd.CalendarEventRecurrencesPeriod)
                {
                    if (dates.DateEnd.HasValue)
                        period.Add( new Period(
                            CalDateTimeFromOffsetAndTimeZone(dates.DateStart, tzid),
                            CalDateTimeFromOffsetAndTimeZone(dates.DateEnd.Value, tzid)));
                    else
                        period.Add( new Period(
                            CalDateTimeFromOffsetAndTimeZone(dates.DateStart, tzid)));
                }

                iCalEvent.RecurrenceDates.Add(period);
            }

        }

        private void FillRecurrencesDatesToDB( Event iCalEvent, CalendarEvents eventForDB)
        {
            var recurrenceDates = iCalEvent.RecurrenceDates;

            if (!recurrenceDates.Any()) return;

            var periodsList = new CalendarEventRecurrencesPeriodList();

            foreach (var prd in recurrenceDates)
            {
                foreach (var dates in prd)
                {
                    periodsList.CalendarEventRecurrencesPeriod.Add(new CalendarEventRecurrencesPeriod{
                        DateStart = new DateTimeOffset(dates.StartTime.AsUtc, TimeSpan.Zero),
                        DateEnd = dates.EndTime != null ? (DateTimeOffset?)new DateTimeOffset(dates.EndTime.AsUtc, TimeSpan.Zero) : null
                    });
                }
            }
            eventForDB.CalendarEventRecurrencesPeriodList.Add(periodsList);

        }



        #endregion

        #region Fill Contacts


        /// <summary>
        /// Fill Contacts
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillContacts(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB)
        {

            if (eventFromDB.CalendarEventsContacts.Any())
                foreach(var ct in eventFromDB.CalendarEventsContacts)
                    iCalEvent.Contacts.Add(ct.Contact);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventForDB"></param>
        private void FillContactsToDB(Event iCalEvent, CalendarEvents eventForDB)
        {
            if (!iCalEvent.Contacts.Any()) return;

            foreach(var contact in iCalEvent.Contacts){
                eventForDB.CalendarEventsContacts.Add(new CalendarEventsContacts(){ Contact = contact, IdEvent = eventForDB.Id});
            }
        }


        #endregion

        #region Fill Attendees


        /// <summary>
        /// Fill Attendees
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillAttendees(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB)
        {
            //cass attendee[0] type: 'MAILTO:myid@mymaildomain.com'
            //cass attendee[1] type: 'John Doe'
            //cass attemdee[2] type: 'Admin, Administrator'
            if (!eventFromDB.CalendarEventsAttendees.Any()) return;

            foreach (var att in eventFromDB.CalendarEventsAttendees)
            {
                iCalEvent.Attendees.Add(new Attendee(att.Uri){ CommonName = att.Attendee, Role = att.Role});
                
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventForDB"></param>
        /// <remarks>Changed by IagoSRL on 2013/05/08 to be generic, accepting any IUniqueComponent.
        /// This allow using the method not only for Events, like originally, else for vfreebusy objects
        /// and others.</remarks>
        private void FillAttendeesToDB(IUniqueComponent iCalObject, CalendarEvents eventForDB)
        {
            if (!iCalObject.Attendees.Any()) return;

            foreach (var atts in iCalObject.Attendees) {
                eventForDB.CalendarEventsAttendees.Add(new CalendarEventsAttendees { 
                    Attendee = atts.CommonName, IdEvent = eventForDB.Id, Role = atts.Role, Uri = atts.Value.ToString()
                });
            }
        }

        #endregion

        #region Fill Comments


        /// <summary>
        /// Fill Comments
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillComments(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB)
        {
            if (eventFromDB.CalendarEventComments.Any())
                foreach(var cmts in eventFromDB.CalendarEventComments)
                    iCalEvent.Comments.Add(cmts.Comment);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="iCalObject"></param>
        /// <param name="objectForDB"></param>
        /// <remarks>Changed by IagoSRL on 2013/05/08 to be generic, accepting any IUniqueComponent
        /// This allow using the method not only for Events, like originally, else for vfreebusy objects
        /// and others.</remarks>
        private void FillCommentsToDB(IUniqueComponent iCalObject, CalendarEvents eventForDB)
        {
            if (!iCalObject.Comments.Any()) return;

            foreach(var comment in iCalObject.Comments)
                eventForDB.CalendarEventComments.Add(new CalendarEventComments { Comment = comment, IdEvent = eventForDB.Id  });            
        }


        #endregion

        #region Fill Recurrences



        /// <summary>
        /// Fill Recurrences
        /// </summary>
        /// <param name="iCalEvent"></param>
        /// <param name="eventFromDB"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        private void FillRecurrences(
            Event iCalEvent,
            CalendarDll.Data.CalendarEvents eventFromDB)
        {

            var recur = eventFromDB.CalendarReccurrence;
            if (!recur.Any()) return;

            foreach (var rec in recur)
            {
                var recPattern = new RecurrencePattern();

                recPattern.Frequency = (FrequencyType)rec.Frequency;
                if (rec.Count != null) recPattern.Count = (Int32)rec.Count;
                if (rec.Until != null) recPattern.Until = rec.Until.Value.UtcDateTime;
                if (rec.Interval != null) recPattern.Interval = (Int32)rec.Interval;
                SetFrequencies(rec, recPattern);

                iCalEvent.RecurrenceRules.Add(recPattern);
            }
        }

        private void FillRecurrencesToDB( Event iCalEvent, CalendarEvents eventforDB)
        {
            if (!iCalEvent.RecurrenceRules.Any()) return;
            foreach (var rec in iCalEvent.RecurrenceRules) {
                var newrec = new CalendarReccurrence
                {
                    EventID = eventforDB.Id,
                    Count = rec.Count,
                    EvaluationMode = rec.EvaluationMode.ToString(),
                    Frequency = Convert.ToInt32(rec.Frequency),
                    Interval = rec.Interval,
                    RestristionType = Convert.ToInt32(rec.RestrictionType),
                    FirstDayOfWeek = Convert.ToInt32(rec.FirstDayOfWeek),
                    
                };
                if (rec.Until != null && rec.Until.Year > 1900) newrec.Until = rec.Until;
                SetFrequenciesToDB(rec, newrec);

                eventforDB.CalendarReccurrence.Add(newrec);
            }

           
                /*eventFromDB.CalendarReccurrence;
            if (!recur.Any()) return;

            foreach (var rec in recur)
            {
                var recPattern = new RecurrencePattern();

                recPattern.Frequency = (FrequencyType)rec.Frequency;
                if (rec.Count != null) recPattern.Count = (Int32)rec.Count;
                if (rec.Until != null) recPattern.Until = (DateTime)rec.Until;
                if (rec.Interval != null) recPattern.Interval = (Int32)rec.Interval;
                SetFrecuencies(rec, recPattern);

                iCalEvent.RecurrenceRules.Add(recPattern);
            }*/
        }

       

        #endregion

        #region Set Frecuencies - for Recurrences


        /// <summary>
        /// Set Frecuencies - for Recurrences
        /// </summary>
        /// <param name="rec"></param>
        /// <param name="recPattern"></param>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>

        private static void SetFrequenciesToDB(IRecurrencePattern rec, CalendarReccurrence newrec)
        {
            if (rec.ByDay.Any())
            {
                foreach (var dy in rec.ByDay)
                {
                    newrec.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency()
                    {
                        ByDay = true,
                        DayOfWeek = Convert.ToInt32(dy.DayOfWeek),
                        FrequencyDay = dy.Offset,
                    });
                }
            }
            if (rec.ByWeekNo.Any())
            {
                foreach (var wk in rec.ByWeekNo)
                {
                    newrec.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency()
                    {
                        ByWeekNo = true,
                        ExtraValue = wk
                    });
                }
            }
            if (rec.ByMonth.Any())
            {
                foreach (var mnt in rec.ByMonth)
                {
                    newrec.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency()
                    {
                        ByMonth = true,
                        ExtraValue = mnt
                    });
                }
            }

            if (rec.ByYearDay.Any())
            {
                foreach (var yr in rec.ByMonth)
                {
                    newrec.CalendarReccurrenceFrequency.Add(new CalendarReccurrenceFrequency()
                    {
                        ByYearDay = true,
                        ExtraValue = yr
                    });
                }
            }
        }

        private void SetFrequencies(
            CalendarDll.Data.CalendarReccurrence rec,
            RecurrencePattern recPattern)
        {

            var frec = rec.CalendarReccurrenceFrequency.ToList();

            foreach (var fr in frec)
            {
                if (fr.ByDay ?? false)
                {
                    //var frecDay = fr.FrequencyDay??-2147483648;
                    // Bugfix: @IagoSRL: DayOfWeek > -1 instead of buggy '> 0', because
                    // Sunday is value 0, and was discarted for recurrence because of this:
                    if (fr.DayOfWeek != null && fr.DayOfWeek > -1) 
                        recPattern.ByDay.Add( new WeekDay((DayOfWeek)fr.DayOfWeek, (FrequencyOccurrence)(fr.FrequencyDay ?? -2147483648)));
                }
                else if (fr.ByHour ?? false)
                {
                    recPattern.ByHour.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.ByMinute ?? false)
                {
                    recPattern.ByMinute.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.ByMonth ?? false)
                {
                  
                    recPattern.ByMonth.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.ByMonthDay ?? false)
                {
                    
                    recPattern.ByMonthDay.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.BySecond ?? false)
                {
                    recPattern.BySecond.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.BySetPosition ?? false)
                {
                    recPattern.BySetPosition.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.ByWeekNo ?? false)
                {
                    
                    recPattern.ByWeekNo.Add(fr.ExtraValue ?? 0);
                }
                else if (fr.ByYearDay ?? false)
                {
                   
                    recPattern.ByYearDay.Add(fr.ExtraValue ?? 0);
                }
            }
        }

        #endregion

        #region Prepare Data for Export

        /// <summary>
        /// Prepare Data for Export
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public Tuple<byte[], string> PrepareExportDataForUser(
            CalendarUser user)
        {


            Calendar iCalForExport = GetCalendarByUserForExport(user);


            var ctx = new SerializationContext();
            var factory = new Ical.Net.Serialization.iCalendar.Factory.SerializerFactory();

            // Get a serializer for our object
            var serializer =
                factory.Build(
                    iCalForExport.GetType(),
                    ctx) as IStringSerializer;

            var output =
                serializer.SerializeToString(
                    iCalForExport);

            var contentType = "text/calendar";

            var bytes = Encoding.UTF8.GetBytes(output);



            return new Tuple<byte[], string>(
                bytes,
                contentType);

        }

        #endregion

        #region Import Calendar
        public Srl.Timeline LastImportTimeline;
        /// <summary>
        /// This property allows limit (when greater than zero) the FreeBusy items
        /// to be imported by setting the limit in number of months of future items
        /// allowed.
        /// This allows avoid the overload of import excessive future items.
        /// In other words: don't import freebusy events from x months and greater in the future.
        /// IMPORTANT: Zero value has special meaning, being 'no limit' (all will get imported)
        /// </summary>
        public uint FutureMonthsLimitForImportingFreeBusy = 0;
        /// <summary>
        /// Import Calendar.
        /// 
        /// STRATEGIES:
        /// When importing an iCalendar there are several precautions we need to take.
        /// 
        /// 1: not import our exported events.
        /// Just in case the user sofware is reading our exported calendar and merging with
        /// user defined events, we need to prevent importing events originally generated by us
        /// (because we have them in database with a different types, to not duplicate, because
        /// we do not let arbitrary editions of that events -even we completely lock them depending
        /// on booking rules-, and at the same time we lock edition of imported events, since 
        /// do not export them).
        /// Strategies to that:
        /// A- check the UID of the imported event and verify it's not at our database
        ///    Costly operation, one read attempt for each record, usually with negative results
        /// B- check a pattern at the UID that we know is generated by us
        ///    Quick. Still do not prevent that others use the same pattern, so we have false positives
        ///    when filtering that events.
        ///    -a check if starts with an asterisk (in use).
        ///      Quick and dirty, too vague. Easy of false positives. 
        ///      ACTUALLY IN USE. TO REPLACE
        ///    -b check if ends with @loconomics.com suffix
        ///      Better approach, difficult of false positives (still positive, but if other follow
        ///      good practices must not happen).
        ///      
        /// TODO switch to strategy B-b.
        /// 
        /// 2: insert/update/remove existing imported events
        /// After the first read, we need to maintain the already imported events, updating them if
        /// any change or removing them if no more exists at the source.
        /// 
        /// Strategies:
        /// A- Keep list of imported identifiers.
        ///   - Detect if an imported record (using UID) exists at DB: choose insert or update
        ///   - When finishing importing, remove from database all user (@UserID) imported events (EventType=4)
        ///     that do not exists at the list of imported identifiers (AND NOT IN (@list))
        ///   More memory consumption; depends on the number of events, can be a lot, to keep the list
        ///   and for the large SQL to generate, or several calls to prevent some length limits.
        /// B- Delete records first.
        ///   Idea: since we don't allow editions, we can safely start by removing previous imported
        ///   records and then insert all others
        ///   - Delete with: (DELETE CalendarEvents WHERE @UserID AND EventType=4)
        ///   - Insert every record from import file.
        ///   Quick (to implement and execute), more writes to database (all the removals, even unneded ones),
        ///   database IDs increase quickly (ID is an auto-increment; risk to reach limit depending on how
        ///   often importing is done).
        ///   ACTUALLY IN USE. TO REPLACE
        /// C- Insert-update, then delete by UpdatedDate
        ///   - Create variable with current date-time as the updatedDate timestamp.
        ///   - Detect if an imported record (using UID) exists at DB: choose insert or update. Use the
        ///     value of updatedDate or newer for the UpdatedDate field of each record.
        ///   - Remove from database all the user (@UserID) imported events (EventType=4) with an
        ///     UpdatedDate older than variable udpatedDate.
        ///   Less memory than A, less writtings to database than B, IDs are kept for updated records.
        ///   Needs analysis: could be slower than B because the check about if an event exists or not (to insert/update),
        ///   but the non removal of records that then are re-created may be faster.
        ///   
        /// TODO switch to strategy C
        /// </summary>
        /// <param name="calendar"></param>
        /// <param name="user"></param>
        /// <returns></returns>
        /// <remarks>2012/11 by CA2S FA, 2012/12/20 by  CA2S RM dynamic version</remarks>
        public bool ImportCalendar(IICalendarCollection calendar,  CalendarUser user)
        {
            //try
            {
#if DEBUG
                if (LastImportTimeline == null)
                    LastImportTimeline = new Srl.Timeline();
#endif

                //----------------------------------------------------------------------
                // Loop that adds the Imported Events to a List of CalendarEvents 
                // which are compatible in their fields with the Loconomics database
                //----------------------------------------------------------------------

                using ( var db = new loconomicsEntities() )
                {
                    //----------------------------------------------------------------------
                    // Delete Previously Imported Events
                    //
                    // This was Iago Lorenzo Salgueiro's recommendation
                    // as it simplifies dealing with Events created externally.
                    // In particular, he was concerned when an Event was deleted
                    // outside Loconomics (for example, Google Calendar)
                    // 
                    // Note: EventType = 4 are the Imported Events
                    //
                    // 2013/01/15 CA2S RM
                    //----------------------------------------------------------------------

#if DEBUG
                    // PERF::
                    LastImportTimeline.SetTime("Deleting previous events: " + user.Id);
#endif

                    /** IMPORTANT:IagoSRL: Changed the deletion of user imported events from being done
                     * through EntityFramework to be done with a manual SQL command **/
                    /*
                    // read the Events for the Specified User and EventType==4 (Imported)
                    var previouslyImportedEventsToDelete =
                        db.CalendarEvents.Where(x =>
                            (x.UserId == user.Id) &&
                            (x.EventType == 4));

                    // Mark the Events as Deleted
                    foreach (var eventToDelete in previouslyImportedEventsToDelete) 
                    {
                        db.CalendarEvents.Remove(eventToDelete);
                    }

                    // Send the Changes (Deletes) to the Database
                    db.SaveChanges();
                    */

                    db.Database.ExecuteSqlCommand("DELETE FROM CalendarEvents WHERE UserID={0} AND EventType={1}", user.Id, 4);

#if DEBUG
                    // PERF::
                    LastImportTimeline.StopTime("Deleting previous events: " + user.Id);

                    // PERF::
                    LastImportTimeline.SetTime("Importing Calendars: " + user.Id);
#endif

                    // Loop for every calendar in the imported file (it must be only one really)
                    foreach (var currentCalendar in calendar)
                    {
                        //----------------------------------------------------------------------
                        // Loop to Import the Events
                        //----------------------------------------------------------------------

#if DEBUG
                        // PERF::
                        LastImportTimeline.SetTime("Importing:: events: " + user.Id);
#endif

                        foreach (Event currEvent in currentCalendar.Events.Where(evs => !evs.Uid.StartsWith("*")))
                        {

                            // Event Types 
                            // (See table: CalendarEventType)
                            //
                            // 1	booking - GENERATES BETWEEN TIME
                            // 2	work hours
                            // 3	availibility events
                            // 4	imported <-- As we are currently Importing, we will use this Type
                            // 5	other


                            //----------------------------------------------------------------------
                            // See if an Event with the same UID already Exists in the DB
                            // If it Exists, don't import, or there will be duplicates
                            //----------------------------------------------------------------------


                            //bool eventAlreadyExists=false;

                            //----------------------------------------------------------------------
                            //// Delete old event
                            //// This won't be necessary anymore, 
                            //// as the Imported Events are deleted beforehand now
                            //// 2013/01/15 CA2S RM
                            //----------------------------------------------------------------------

                            //var eventExist = db.CalendarEvents.FirstOrDefault(
                            //    ev => ev.UID == currEvent.UID);

                            //if (eventExist != null)
                            //{
                            //    db.CalendarEvents.Remove(eventExist);
                            //   // db.SaveChanges();
                            //}

                            //----------------------------------------------------------------------

                            // TZ This may not be needed, or done in a different way, to support Time Zones properly
                            //// Convert the whole event to our System Time Zone before being inserted.
                            //UpdateEventDatesToSystemTimeZone(currEvent);

                            var startTime = DateTimeOffsetFromCalDateTime(currEvent.Start);

                            // Calculate the end date basing in the real End date set or the Start date
                            // plus the event Duration. For case of error (no dates) gets as default
                            // the minimum date (and will be discarded)
                            var calculatedEndDate = currEvent.End.HasDate ? DateTimeOffsetFromCalDateTime(currEvent.End) :
                                startTime.Add(currEvent.Duration);

                            // Check if this is a past event that doesn't need to be imported (only non recurrent ones)
                            if (calculatedEndDate < DateTime.Now
                                && currEvent.RecurrenceDates.Count == 0
                                && currEvent.RecurrenceRules.Count == 0)
                            {
                                // Old event, discarded, continue with next:
                                continue;
                            }

                            // Create event
                            var eventForDB = new CalendarEvents()
                            {
                                CreatedDate = DateTimeOffset.Now,
                                UID = currEvent.Uid,
                                UserId = user.Id,
                                StartTime = startTime,
                                // IagoSRL @Loconomics: Added TimeZone based on the StartTime TZID (we suppose endtime use the same, is the most common,
                                // and our back-end calendar doesn't support one timezone per start-end date)
                                TimeZone = currEvent.Start.TzId,
                                EndTime = calculatedEndDate,
                                Organizer = (currEvent.Organizer != null) ? currEvent.Organizer.CommonName : string.Empty,
                                CalendarAvailabilityTypeID = getAvailabilityId(currEvent),
                                Transparency = getTransparency((int)currEvent.Status),
                                Summary = currEvent.Summary,
                                EventType = 4,  // 4 = Imported
                                IsAllDay = false
                            };

                            FillExceptionsDatesToDB(currEvent, eventForDB);
                            FillRecurrencesDatesToDB(currEvent, eventForDB);
                            FillContactsToDB(currEvent, eventForDB);
                            FillAttendeesToDB(currEvent, eventForDB);
                            FillCommentsToDB(currEvent, eventForDB);
                            FillRecurrencesToDB(currEvent, eventForDB);

                            // Add to the DB

                            db.CalendarEvents.Add(eventForDB);
                        } // foreach (Event currEvent in...

#if DEBUG
                        // PERF::
                        LastImportTimeline.StopTime("Importing:: events: " + user.Id);
#endif

                        // By IagoSRL @Loconomics:
                        // To support Public Calendars, that mainly provide VFREEBUSY (and most of times only that kind of elements),
                        // we need import too the VFREEBUSY blocks, and we will create a single and simple event for each of that,
                        // with automatic name/summary and the given availability:

                        // Calculate the future date limit to avoid recalculate on every item
                        var futureDateLimit = DateTime.Now.AddMonths((int)FutureMonthsLimitForImportingFreeBusy);

#if DEBUG
                        // PERF::
                        LastImportTimeline.SetTime("Importing:: freebusy: " + user.Id);
#endif

                        foreach (var fb in currentCalendar.FreeBusy.Where(fb => !fb.Uid.StartsWith("*")))
                        {
                            //// Convert the whole freebusy to our System Time Zone before being inserted
                            //// (it updates too all the freebusy.entries)
                            //UpdateFreeBusyDatesToSystemTimeZone(fb);

                            // If the FreeBusy block contains Entries, one event must be created for each entry
                            if (fb.Entries != null && fb.Entries.Count > 0)
                            {
                                int ientry = 0;
                                foreach (var fbentry in fb.Entries)
                                {
                                    ientry++;

                                    var startTime = DateTimeOffsetFromCalDateTime(fbentry.StartTime);

                                    // Calculate the end date basing in the real End date set or the Start date
                                    // plus the entry Duration. For case of error (no dates) gets as default
                                    // the minimum date (and will be discarded)
                                    var calculatedEndDate = fbentry.EndTime.HasDate ? DateTimeOffsetFromCalDateTime(fbentry.EndTime) :
                                        startTime.Add(fbentry.Duration);

                                    // Check if this is a past entry that doesn't need to be imported
                                    if (calculatedEndDate < DateTime.Now)
                                    {
                                        // Old, discarded, continue with next:
                                        continue;
                                    }

                                    // Check if there is a limit and is exceeded
                                    if (FutureMonthsLimitForImportingFreeBusy > 0 &&
                                        calculatedEndDate > futureDateLimit)
                                    {
                                        // Exceed the 'future' limit, discard:
                                        continue;
                                    }

                                    var availID = getAvailabilityId(fbentry);
                                    var dbevent = new CalendarEvents()
                                    {
                                        CreatedDate = DateTimeOffset.Now,
                                        UpdatedDate = DateTimeOffset.Now,
                                        ModifyBy = "importer",
                                        UID = fb.Uid + "_freebusyentry:" + ientry.ToString(),
                                        UserId = user.Id,
                                        StartTime = startTime,
                                        TimeZone = fbentry.StartTime.TzId,
                                        EndTime = calculatedEndDate,
                                        Organizer = (fb.Organizer != null) ? fb.Organizer.CommonName : string.Empty,
                                        CalendarAvailabilityTypeID = (int)availID,
                                        Transparency = false,
                                        Summary = (fb.Properties["SUMMARY"] != null ? fb.Properties["SUMMARY"].Value : availID).ToString(),
                                        EventType = 4, // 4 = Imported
                                        IsAllDay = false
                                    };
                                    // Linked records
                                    FillCommentsToDB(fb, dbevent);
                                    FillAttendeesToDB(fb, dbevent);
                                    // Add to database
                                    db.CalendarEvents.Add(dbevent);
                                }
                            }
                            // If there is no entries, the event is created for the vfreebusy dtstart-dtend dates:
                            else
                            {
                                // Calculate the end date basing in the real End date set or the Start date.
                                // For case of error (no dates) gets as default
                                // the minimum date (and will be discarded)
                                var calculatedEndDate = fb.DtEnd.HasDate ? fb.DtEnd.Value :
                                    fb.DtStart.HasDate ? fb.DtStart.Value :
                                    DateTime.MinValue;

                                // Check if this is a past entry that doesn't need to be imported
                                if (calculatedEndDate < DateTime.Now)
                                {
                                    // Old, discarded, continue with next:
                                    continue;
                                }

                                // Check if there is a limit and is exceeded
                                if (FutureMonthsLimitForImportingFreeBusy > 0 &&
                                    calculatedEndDate > futureDateLimit)
                                {
                                    // Exceed the 'future' limit, discard:
                                    continue;
                                }

                                // The availability for a VFREEBUSY is ever 'Busy', because the object doesn't
                                // allow set the availability/status information, it goes inside freebusy-entries when
                                // there are some.
                                var availID = AvailabilityTypes.BUSY;
                                var dbevent = new CalendarEvents()
                                {
                                    CreatedDate = DateTimeOffset.Now,
                                    UpdatedDate = DateTimeOffset.Now,
                                    ModifyBy = "importer",
                                    UID = fb.Uid,
                                    UserId = user.Id,
                                    StartTime = fb.DtStart.Value,
                                    TimeZone = fb.DtStart.TzId,
                                    EndTime = calculatedEndDate, //fb.DTEnd.Value,
                                    Organizer = (fb.Organizer != null) ? fb.Organizer.CommonName : string.Empty,
                                    CalendarAvailabilityTypeID = (int)availID,
                                    Transparency = false,
                                    Summary = (fb.Properties["SUMMARY"] != null ? fb.Properties["SUMMARY"].Value : availID).ToString(),
                                    EventType = 4, // 4 = Imported
                                    IsAllDay = false
                                };
                                // Linked records
                                FillCommentsToDB(fb, dbevent);
                                FillAttendeesToDB(fb, dbevent);
                                // Add to database
                                db.CalendarEvents.Add(dbevent);
                            }
                        }

#if DEBUG
                        // PERF::
                        LastImportTimeline.StopTime("Importing:: freebusy: " + user.Id);
#endif

                    } // Ends foreach calendar

                    //----------------------------------------------------------------------
                    // Saves the Events to the Database
                    //----------------------------------------------------------------------

#if DEBUG
                    // PERF::
                    LastImportTimeline.SetTime("Importing:: saving to db: " + user.Id);
#endif
                    
                    db.SaveChanges();

#if DEBUG
                    // PERF::
                    LastImportTimeline.StopTime("Importing:: saving to db: " + user.Id);

                    // PERF::
                    LastImportTimeline.StopTime("Importing Calendars: " + user.Id);
#endif

                } //  using ( var db = new CalendarDll.Data.loconomicsEntities() )



                //----------------------------------------------------------------------
                // Reports Import was successful
                //----------------------------------------------------------------------

                return true;

            }
            //catch (Exception ex)
            //{
            //    return false;
            //}

        }
        /*
        /// <summary>
        /// Modify the passed @anEvent updating its date-time fields from its
        /// original time zone to the current system time zone (we are using California
        /// TimeZone in our server and database data).
        /// It updates every elements collection inside it (ExceptionDates, RecurrenceDates)
        /// 
        /// IagoSRL @Loconomics
        /// </summary>
        /// <param name="anEvent"></param>
        public void UpdateEventDatesToSystemTimeZone(IEvent anEvent) {
            // IMPORTANT:IagoSRL@2015-12-10: Assigning new values is being problematic, since there are some
            // underlying calculations that overwrite the assigned values.
            // Discovered while in issue #851, where any value assigned to End/DTEnd gets discarded and
            // a new one, that has the original value and UTC mark, is put in place, resulting in no-change and
            // the bug commented on that issue.
            // After testing, it seems only affects to property End/DTEnd, but applying to both Start and End to ensure no more side-effects,
            // with exceptions: check for null values and use assignement to force some internal calculations but still do a manual calculation with Duration
            // (covering lot of cases; paranoid?)
            // EXAMPLE TO BE CLEAR, doing next is BUGGY
            // anEvent.End = UpdateDateToSystemTimeZone(anEvent.End);
            // GETS FIXED USING NEXT
            // anEvent.End.CopyFrom(UpdateDateToSystemTimeZone(anEvent.End));


            //new CalDateTime(datetime.AsUtc, "UTC");

            //var start = UpdateDateToSystemTimeZone(anEvent.Start);
            //var end = UpdateDateToSystemTimeZone(anEvent.End);
            /*if (start != null && end != null)
            {
                anEvent.Start.CopyFrom(start);
                anEvent.End.CopyFrom(end);
            }
            else if (start != null) // end is null
            {
                anEvent.Start = start;
                anEvent.End = start.Add(anEvent.Duration);
            }
            else // start is null (unique possibility here)
            {
                anEvent.End = end;
                anEvent.Start = end.Subtract(anEvent.Duration);
            }* /

            anEvent.DtStamp = UpdateDateToSystemTimeZone(anEvent.DtStamp);
            anEvent.Created = UpdateDateToSystemTimeZone(anEvent.Created);
            anEvent.LastModified = UpdateDateToSystemTimeZone(anEvent.LastModified);
            //anEvent.RecurrenceId = UpdateDateToSystemTimeZone(anEvent.RecurrenceId);

            foreach (var exDate in anEvent.ExceptionDates)
            {
                foreach (var d in exDate)
                {
                    d.StartTime = UpdateDateToSystemTimeZone(d.StartTime);
                    d.EndTime = UpdateDateToSystemTimeZone(d.EndTime);
                }
            }
            //foreach (var exRule in anEvent.ExceptionRules)
            //{
                // NOTHING to update
            //}
            foreach (var reDate in anEvent.RecurrenceDates)
            {
                foreach (var d in reDate)
                {
                    d.EndTime = UpdateDateToSystemTimeZone(d.EndTime);
                    d.StartTime = UpdateDateToSystemTimeZone(d.StartTime);
                }
            }
            //foreach (var reRule in anEvent.RecurrenceRules)
            //{
                // NOTHING to update
            //}
        }*/
        /*
        /// <summary>
        /// Modify the passed @freebusy updating its date-time fields from its
        /// original time zone to the current system time zone (we are using California
        /// TimeZone in our server and database data).
        /// It updates every elements collection inside it (freebusyentries)
        /// 
        /// IagoSRL @Loconomics
        /// </summary>
        /// <param name="freebusy"></param>
        public void UpdateFreeBusyDatesToSystemTimeZone(IFreeBusy freebusy)
        {
            // IFreeBusy.Start is an alias for DTStart.
            //freebusy.Start = UpdateDateToSystemTimeZone(freebusy.Start);
            // IFreeBusy.End is an alias for DTEnd.
            //freebusy.End = UpdateDateToSystemTimeZone(freebusy.End);
            freebusy.DtStamp = UpdateDateToSystemTimeZone(freebusy.DtStamp);
            // Update all its entries
            foreach (var freebusyentry in freebusy.Entries)
            {
                freebusyentry.EndTime = UpdateDateToSystemTimeZone(freebusyentry.EndTime);
                freebusyentry.StartTime = UpdateDateToSystemTimeZone(freebusyentry.StartTime);
            }
        }*/
        /*
        /// <summary>
        /// Returns an updated datetime object converting the given one
        /// to the system time zone (we are using California TimeZone in our
        /// server and database data).
        /// 
        /// IagoSRL @Loconomics
        /// 
        /// IMPORTANT: only needed for fields that in database are saved as DateTime
        /// but not as DateTimeOffset
        /// </summary>
        /// <param name="datetime"></param>
        /// <returns></returns>
        public IDateTime UpdateDateToSystemTimeZone(IDateTime datetime)
        {
            if (datetime == null)
                return null;
            // We use a combination of DDay conversion and .Net conversion.
            // The DDay method IDateTime.Local is 'supposed' to do just what we
            // want, BUT FAILS (tested a log, is buggy).
            // But, its IDateTime.UTC works fine, it detects properly the
            // TimeZone of the imported DateTime and converts fine to UTC.
            // After that, we use the .Net conversion to local time (server time,
            // we use server at California, what we wants, then all goes fine :-).
            return new CalDateTime(datetime.AsUtc.ToLocalTime());
            // And done! (fiuu... some debug, tests and notes following, it was
            // time spending because DDay buggy 'Local', but ended simple and working).

            /* DEBUGING, testing buggy 'Local' and looking for correct way:
            System.IO.File.AppendAllText(@"E:\web\loconomi\beta\_logs\calendardll.log", String.Format(
                "{3:s}Z:: UpdateDateToSystemTimeZone {4} A Source {0} ; Converted to Local: {1} ; Converted to UTC: {2} \n",
                datetime,
                datetime.Value.ToLocalTime(),
                datetime.Value.ToUniversalTime(),
                DateTime.Now.ToUniversalTime(),
                TimeZoneInfo.Local.Id
            ));
            //datetime.IsUniversalTime = true;
            System.IO.File.AppendAllText(@"E:\web\loconomi\beta\_logs\calendardll.log", String.Format(
                "{3:s}Z:: UpdateDateToSystemTimeZone {4} B Source {0} ; Converted to Local: {1} ; Converted to icalLocal: {2} \n",
                datetime,
                datetime.Local,
                datetime.UTC,
                datetime.Local.ToLocalTime(),
                DateTime.Now
            ));
            * /

            /* Alternative guide-lines for conversion:
            //var timeZone = datetime.Calendar.GetTimeZone(datetime.TZID);
            // Find what TimeZoneInfo we must use:
            // -- //timeZone.TimeZoneInfos[0]
            // Convert from object TimeZoneInfo to the system TimeZone
            // --
            // Returns the updated datetime
            //return datetime;
            * /
        }*/

        #endregion

    }
}
