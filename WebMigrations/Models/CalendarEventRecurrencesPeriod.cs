namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("CalendarEventRecurrencesPeriod")]
    public partial class CalendarEventRecurrencesPeriod
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int IdRecurrence { get; set; }

        [Key]
        [Column(Order = 1)]
        public DateTimeOffset DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }

        public virtual CalendarEventRecurrencesPeriodList CalendarEventRecurrencesPeriodList { get; set; }
    }
}
