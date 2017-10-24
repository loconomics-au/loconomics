namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("servicesubcategory")]
    public partial class servicesubcategory
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ServiceSubCategoryID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        [StringLength(45)]
        public string Name { get; set; }

        [StringLength(250)]
        public string Description { get; set; }

        public DateTime? CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }

        [StringLength(2)]
        public string ModifiedBy { get; set; }

        public bool? Active { get; set; }

        public int? ServiceCategoryID { get; set; }

        public int? Rank { get; set; }

        [StringLength(200)]
        public string RankQuery { get; set; }

        public virtual servicecategory servicecategory { get; set; }
    }
}
