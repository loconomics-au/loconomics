namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("CalendarReccurrence")]
    public partial class CalendarReccurrence
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public CalendarReccurrence()
        {
            CalendarReccurrenceFrequencies = new HashSet<CalendarReccurrenceFrequency>();
        }

        public int ID { get; set; }

        public int? EventID { get; set; }

        public int? Count { get; set; }

        [StringLength(50)]
        public string EvaluationMode { get; set; }

        public int? Frequency { get; set; }

        public int? Interval { get; set; }

        public int? RestristionType { get; set; }

        public DateTimeOffset? Until { get; set; }

        public int? FirstDayOfWeek { get; set; }

        public virtual CalendarEvent CalendarEvent { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CalendarReccurrenceFrequency> CalendarReccurrenceFrequencies { get; set; }

        public virtual CalendarRecurrenceFrequencyType CalendarRecurrenceFrequencyType { get; set; }
    }
}
