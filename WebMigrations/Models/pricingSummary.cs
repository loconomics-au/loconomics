namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("pricingSummary")]
    public partial class pricingSummary
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public pricingSummary()
        {
            bookings = new HashSet<booking>();
        }

        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PricingSummaryID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PricingSummaryRevision { get; set; }

        public int? ServiceDurationMinutes { get; set; }

        public int? FirstSessionDurationMinutes { get; set; }

        public decimal? SubtotalPrice { get; set; }

        public decimal? ClientServiceFeePrice { get; set; }

        public decimal? TotalPrice { get; set; }

        public decimal? ServiceFeeAmount { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        public DateTime? CancellationDate { get; set; }

        public decimal? CancellationFeeCharged { get; set; }

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
