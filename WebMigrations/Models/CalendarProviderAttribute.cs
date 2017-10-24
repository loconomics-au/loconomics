namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class CalendarProviderAttribute
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int UserID { get; set; }

        public decimal AdvanceTime { get; set; }

        public decimal MinTime { get; set; }

        public decimal MaxTime { get; set; }

        public decimal BetweenTime { get; set; }

        public bool UseCalendarProgram { get; set; }

        [StringLength(200)]
        public string CalendarType { get; set; }

        [StringLength(500)]
        public string CalendarURL { get; set; }

        [StringLength(128)]
        public string PrivateCalendarToken { get; set; }

        public int IncrementsSizeInMinutes { get; set; }

        [StringLength(50)]
        public string TimeZone { get; set; }

        public virtual user user { get; set; }
    }
}
