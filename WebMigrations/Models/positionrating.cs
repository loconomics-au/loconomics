namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class positionrating
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PositionID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        [Required]
        [StringLength(25)]
        public string Rating1 { get; set; }

        [Required]
        [StringLength(25)]
        public string Rating2 { get; set; }

        [Required]
        [StringLength(25)]
        public string Rating3 { get; set; }

        [StringLength(25)]
        public string Rating4 { get; set; }

        [StringLength(1000)]
        public string Rating1FormDescription { get; set; }

        [StringLength(1000)]
        public string Rating2FormDescription { get; set; }

        [StringLength(1000)]
        public string Rating3FormDescription { get; set; }

        [StringLength(1000)]
        public string Rating4FormDescription { get; set; }

        [StringLength(1000)]
        public string Rating1ProfileDescription { get; set; }

        [StringLength(1000)]
        public string Rating2ProfileDescription { get; set; }

        [StringLength(1000)]
        public string Rating3ProfileDescription { get; set; }

        [StringLength(1000)]
        public string Rating4ProfileDescription { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }
    }
}
