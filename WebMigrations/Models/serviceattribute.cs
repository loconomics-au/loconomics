namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("serviceattribute")]
    public partial class serviceattribute
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ServiceAttributeID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        public int? SourceID { get; set; }

        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(2000)]
        public string ServiceAttributeDescription { get; set; }

        public DateTime? CreateDate { get; set; }

        public DateTime? UpdatedDate { get; set; }

        [StringLength(45)]
        public string ModifiedBy { get; set; }

        public bool? Active { get; set; }

        public int DisplayRank { get; set; }

        public int? PositionReference { get; set; }

        public int? EnteredByUserID { get; set; }

        public bool? Approved { get; set; }
    }
}
