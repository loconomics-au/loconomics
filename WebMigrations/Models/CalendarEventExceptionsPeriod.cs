namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("CalendarEventExceptionsPeriod")]
    public partial class CalendarEventExceptionsPeriod
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int IdException { get; set; }

        [Key]
        [Column(Order = 1)]
        public DateTimeOffset DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }

        public virtual CalendarEventExceptionsPeriodsList CalendarEventExceptionsPeriodsList { get; set; }
    }
}
