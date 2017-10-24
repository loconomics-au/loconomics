namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("verification")]
    public partial class verification
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int VerificationID { get; set; }

        [Required]
        [StringLength(100)]
        public string VerificationType { get; set; }

        [Required]
        [StringLength(1000)]
        public string VerificationDescription { get; set; }

        [StringLength(500)]
        public string VerificationProcess { get; set; }

        [StringLength(15)]
        public string Icon { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime ModifiedDate { get; set; }

        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        public int VerificationCategoryID { get; set; }

        public int? RankPosition { get; set; }

        [StringLength(20)]
        public string SummaryGroup { get; set; }
    }
}
