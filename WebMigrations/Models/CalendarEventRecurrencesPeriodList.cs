namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("CalendarEventRecurrencesPeriodList")]
    public partial class CalendarEventRecurrencesPeriodList
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public CalendarEventRecurrencesPeriodList()
        {
            CalendarEventRecurrencesPeriods = new HashSet<CalendarEventRecurrencesPeriod>();
        }

        public int Id { get; set; }

        public int IdEvent { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CalendarEventRecurrencesPeriod> CalendarEventRecurrencesPeriods { get; set; }

        public virtual CalendarEvent CalendarEvent { get; set; }
    }
}
