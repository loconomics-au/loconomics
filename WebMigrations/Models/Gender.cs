namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("Gender")]
    public partial class Gender
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int GenderID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        [Required]
        [StringLength(16)]
        public string GenderSingular { get; set; }

        [Required]
        [StringLength(16)]
        public string GenderPlural { get; set; }

        [StringLength(25)]
        public string SubjectPronoun { get; set; }

        [StringLength(25)]
        public string ObjectPronoun { get; set; }

        [StringLength(25)]
        public string PossesivePronoun { get; set; }
    }
}
