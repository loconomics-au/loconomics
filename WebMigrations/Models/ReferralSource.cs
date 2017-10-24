namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("ReferralSource")]
    public partial class ReferralSource
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public ReferralSource()
        {
            ServiceProfessionalClients = new HashSet<ServiceProfessionalClient>();
        }

        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ReferralSourceID { get; set; }

        [Required]
        [StringLength(80)]
        public string Name { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<ServiceProfessionalClient> ServiceProfessionalClients { get; set; }
    }
}
