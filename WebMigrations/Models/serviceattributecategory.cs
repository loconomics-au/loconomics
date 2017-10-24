namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("serviceattributecategory")]
    public partial class serviceattributecategory
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ServiceAttributeCategoryID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        [Column("ServiceAttributeCategory")]
        [StringLength(200)]
        public string ServiceAttributeCategory1 { get; set; }

        public DateTime? CreateDate { get; set; }

        public DateTime? UpdatedDate { get; set; }

        [StringLength(20)]
        public string ModifiedBy { get; set; }

        public bool? Active { get; set; }

        public int? SourceID { get; set; }

        public bool? PricingOptionCategory { get; set; }

        [StringLength(500)]
        public string ServiceAttributeCategoryDescription { get; set; }

        public bool RequiredInput { get; set; }

        public bool SideBarCategory { get; set; }

        public bool EligibleForPackages { get; set; }

        public int DisplayRank { get; set; }

        public int? PositionReference { get; set; }

        public bool BookingPathSelection { get; set; }
    }
}
