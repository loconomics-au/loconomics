namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class CalendarEvent
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public CalendarEvent()
        {
            bookings = new HashSet<booking>();
            bookings1 = new HashSet<booking>();
            bookings2 = new HashSet<booking>();
            CalendarEventComments = new HashSet<CalendarEventComment>();
            CalendarEventExceptionsPeriodsLists = new HashSet<CalendarEventExceptionsPeriodsList>();
            CalendarEventRecurrencesPeriodLists = new HashSet<CalendarEventRecurrencesPeriodList>();
            CalendarEventsAttendees = new HashSet<CalendarEventsAttendee>();
            CalendarEventsContacts = new HashSet<CalendarEventsContact>();
            CalendarReccurrences = new HashSet<CalendarReccurrence>();
        }

        public int Id { get; set; }

        public int UserId { get; set; }

        public int EventType { get; set; }

        [StringLength(500)]
        public string Summary { get; set; }

        public DateTimeOffset? StarTtime { get; set; }

        public DateTimeOffset? EndTime { get; set; }

        [StringLength(150)]
        public string UID { get; set; }

        public int CalendarAvailabilityTypeID { get; set; }

        public bool Transparency { get; set; }

        public bool IsAllDay { get; set; }

        public DateTimeOffset? StampTime { get; set; }

        [StringLength(100)]
        public string TimeZone { get; set; }

        public int? Priority { get; set; }

        [StringLength(100)]
        public string Location { get; set; }

        public DateTimeOffset? UpdatedDate { get; set; }

        public DateTimeOffset? CreatedDate { get; set; }

        [StringLength(50)]
        public string ModifyBy { get; set; }

        [StringLength(50)]
        public string Class { get; set; }

        public string Organizer { get; set; }

        public int? Sequence { get; set; }

        [StringLength(100)]
        public string Geo { get; set; }

        public DateTimeOffset? RecurrenceId { get; set; }

        public TimeSpan? TimeBlock { get; set; }

        public int? DayofWeek { get; set; }

        public string Description { get; set; }

        public DateTimeOffset? Deleted { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> bookings { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> bookings1 { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> bookings2 { get; set; }

        public virtual CalendarAvailabilityType CalendarAvailabilityType { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CalendarEventComment> CalendarEventComments { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CalendarEventExceptionsPeriodsList> CalendarEventExceptionsPeriodsLists { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CalendarEventRecurrencesPeriodList> CalendarEventRecurrencesPeriodLists { get; set; }

        public virtual CalendarEventType CalendarEventType { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CalendarEventsAttendee> CalendarEventsAttendees { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CalendarEventsContact> CalendarEventsContacts { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CalendarReccurrence> CalendarReccurrences { get; set; }
    }
}
