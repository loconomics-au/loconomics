namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("alerttype")]
    public partial class alerttype
    {
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int AlertTypeID { get; set; }

        [Required]
        [StringLength(200)]
        public string AlertTypeName { get; set; }

        [StringLength(200)]
        public string AlertTypeDescription { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        public int LanguageID { get; set; }

        public int CountryID { get; set; }

        public int DisplayRank { get; set; }
    }
}
