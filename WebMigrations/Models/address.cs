namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("address")]
    public partial class address
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public address()
        {
            bookings = new HashSet<booking>();
        }

        public int AddressID { get; set; }

        public int UserID { get; set; }

        public int AddressTypeID { get; set; }

        [Required]
        [StringLength(50)]
        public string AddressName { get; set; }

        [Required]
        [StringLength(100)]
        public string AddressLine1 { get; set; }

        [StringLength(100)]
        public string AddressLine2 { get; set; }

        [Required]
        [StringLength(100)]
        public string City { get; set; }

        public int StateProvinceID { get; set; }

        public int PostalCodeID { get; set; }

        public int CountryID { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        [StringLength(2073)]
        public string GoogleMapsURL { get; set; }

        [StringLength(1000)]
        public string SpecialInstructions { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool? Active { get; set; }

        public int CreatedBy { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> bookings { get; set; }
    }
}
