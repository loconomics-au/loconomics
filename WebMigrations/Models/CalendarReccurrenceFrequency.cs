namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("CalendarReccurrenceFrequency")]
    public partial class CalendarReccurrenceFrequency
    {
        public int ID { get; set; }

        public int? CalendarReccursiveID { get; set; }

        public bool? ByDay { get; set; }

        public bool? ByHour { get; set; }

        public bool? ByMinute { get; set; }

        public bool? ByMonth { get; set; }

        public bool? ByMonthDay { get; set; }

        public bool? BySecond { get; set; }

        public bool? BySetPosition { get; set; }

        public bool? ByWeekNo { get; set; }

        public bool? ByYearDay { get; set; }

        public int? ExtraValue { get; set; }

        public int? FrequencyDay { get; set; }

        public int? DayOfWeek { get; set; }

        public virtual CalendarReccurrence CalendarReccurrence { get; set; }
    }
}
