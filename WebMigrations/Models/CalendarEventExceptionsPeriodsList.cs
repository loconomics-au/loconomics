namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("CalendarEventExceptionsPeriodsList")]
    public partial class CalendarEventExceptionsPeriodsList
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public CalendarEventExceptionsPeriodsList()
        {
            CalendarEventExceptionsPeriods = new HashSet<CalendarEventExceptionsPeriod>();
        }

        public int Id { get; set; }

        public int IdEvent { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CalendarEventExceptionsPeriod> CalendarEventExceptionsPeriods { get; set; }

        public virtual CalendarEvent CalendarEvent { get; set; }
    }
}
