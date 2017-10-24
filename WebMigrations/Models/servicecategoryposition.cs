namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("servicecategoryposition")]
    public partial class servicecategoryposition
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ServiceCategoryID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PositionID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 3)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        public int Rank { get; set; }

        public DateTime CreateDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public int Active { get; set; }
    }
}
