namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("userprofile")]
    public partial class userprofile
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public userprofile()
        {
            webpages_Roles = new HashSet<webpages_Roles>();
        }

        [Key]
        public int UserId { get; set; }

        [Required]
        [StringLength(254)]
        public string Email { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<webpages_Roles> webpages_Roles { get; set; }
    }
}
