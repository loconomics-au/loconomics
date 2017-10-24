namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("country")]
    public partial class country
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Required]
        [StringLength(100)]
        public string CountryName { get; set; }

        [Required]
        [StringLength(3)]
        public string CountryCode { get; set; }

        [StringLength(2)]
        public string CountryCodeAlpha2 { get; set; }

        [StringLength(3)]
        public string CountryCallingCode { get; set; }

        public DateTime? CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }

        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        public int? numcode { get; set; }
    }
}
