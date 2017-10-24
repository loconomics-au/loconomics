namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("VOCElement")]
    public partial class VOCElement
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int VOCElementID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        [StringLength(100)]
        public string VOCElementName { get; set; }

        public int? ScoreStartValue { get; set; }

        public int? ScoreMidValue { get; set; }

        public int? ScoreEndValue { get; set; }

        [StringLength(25)]
        public string ScoreStartLabel { get; set; }

        [StringLength(25)]
        public string ScoreMidLabel { get; set; }

        [StringLength(25)]
        public string ScoreEndLabel { get; set; }

        public DateTime CreateDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(3)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }
    }
}
