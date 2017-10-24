namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("municipality")]
    public partial class municipality
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public municipality()
        {
            postalcodes = new HashSet<postalcode>();
        }

        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int MunicipalityID { get; set; }

        public int CountyID { get; set; }

        [Required]
        [StringLength(100)]
        public string MunicipalityName { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public virtual county county { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<postalcode> postalcodes { get; set; }
    }
}
