namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("VOCExperienceCategory")]
    public partial class VOCExperienceCategory
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int VOCExperienceCategoryID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        [StringLength(50)]
        public string VOCExperienceCategoryName { get; set; }

        [StringLength(200)]
        public string VOCExperienceCategoryDescription { get; set; }

        public DateTime CreateDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(3)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }
    }
}
