namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("providertaxform")]
    public partial class providertaxform
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ProviderUserID { get; set; }

        [Required]
        [StringLength(200)]
        public string FullName { get; set; }

        [StringLength(200)]
        public string BusinessName { get; set; }

        [Required]
        [StringLength(100)]
        public string StreetApt { get; set; }

        [Required]
        [StringLength(100)]
        public string City { get; set; }

        public int? PostalCodeID { get; set; }

        public int StateProvinceID { get; set; }

        public int CountryID { get; set; }

        public int TaxEntityTypeID { get; set; }

        public bool ExemptPayee { get; set; }

        [Required]
        [StringLength(25)]
        public string TINTypeID { get; set; }

        [Required]
        [StringLength(200)]
        public string Signature { get; set; }

        [Required]
        [StringLength(500)]
        public string UserIPAddress { get; set; }

        public DateTime DateTimeSubmitted { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        [StringLength(64)]
        public string LastThreeTINDigits { get; set; }
    }
}
