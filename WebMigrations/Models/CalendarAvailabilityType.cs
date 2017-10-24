namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("CalendarAvailabilityType")]
    public partial class CalendarAvailabilityType
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public CalendarAvailabilityType()
        {
            CalendarEvents = new HashSet<CalendarEvent>();
        }

        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CalendarAvailabilityTypeID { get; set; }

        public int LanguageID { get; set; }

        public int CountryID { get; set; }

        [Required]
        [StringLength(50)]
        public string CalendarAvailabilityTypeName { get; set; }

        [Required]
        [StringLength(300)]
        public string CalendarAvailabilityTypeDescription { get; set; }

        [StringLength(500)]
        public string UserDescription { get; set; }

        public bool AddAppointmentType { get; set; }

        [StringLength(50)]
        public string SelectableAs { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CalendarEvent> CalendarEvents { get; set; }
    }
}
