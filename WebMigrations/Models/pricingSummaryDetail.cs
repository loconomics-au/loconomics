namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("pricingSummaryDetail")]
    public partial class pricingSummaryDetail
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PricingSummaryID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PricingSummaryRevision { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ServiceProfessionalServiceID { get; set; }

        [StringLength(100)]
        public string ServiceProfessionalDataInput { get; set; }

        [StringLength(500)]
        public string ClientDataInput { get; set; }

        public decimal? HourlyPrice { get; set; }

        public decimal? Price { get; set; }

        public int? ServiceDurationMinutes { get; set; }

        public int? FirstSessionDurationMinutes { get; set; }

        [Required]
        [StringLength(50)]
        public string ServiceName { get; set; }

        [StringLength(1000)]
        public string ServiceDescription { get; set; }

        public int NumberOfSessions { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }
    }
}
