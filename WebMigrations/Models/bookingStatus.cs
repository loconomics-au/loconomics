namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class bookingStatus
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public bookingStatus()
        {
            bookings = new HashSet<booking>();
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int BookingStatusID { get; set; }

        [Required]
        [StringLength(50)]
        public string BookingStatusName { get; set; }

        [StringLength(500)]
        public string BookingStatusDescription { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> bookings { get; set; }
    }
}
