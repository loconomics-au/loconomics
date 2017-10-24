namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("bookingType")]
    public partial class bookingType
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public bookingType()
        {
            bookings = new HashSet<booking>();
        }

        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int BookingTypeID { get; set; }

        [Required]
        [StringLength(50)]
        public string BookingTypeName { get; set; }

        [StringLength(500)]
        public string BookingTypeDescription { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        public decimal FirstTimeServiceFeeFixed { get; set; }

        public decimal FirstTimeServiceFeePercentage { get; set; }

        public decimal PaymentProcessingFeePercentage { get; set; }

        public decimal PaymentProcessingFeeFixed { get; set; }

        public decimal FirstTimeServiceFeeMaximum { get; set; }

        public decimal FirstTimeServiceFeeMinimum { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> bookings { get; set; }
    }
}
