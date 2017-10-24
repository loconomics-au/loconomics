namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("PricingVariableDefinition")]
    public partial class PricingVariableDefinition
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PricingVariableID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        [Key]
        [Column(Order = 3)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PositionID { get; set; }

        [Key]
        [Column(Order = 4)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PricingTypeID { get; set; }

        [Required]
        [StringLength(60)]
        public string InternalName { get; set; }

        public bool IsProviderVariable { get; set; }

        public bool IsCustomerVariable { get; set; }

        [Required]
        [StringLength(50)]
        public string DataType { get; set; }

        [StringLength(100)]
        public string VariableLabel { get; set; }

        [StringLength(200)]
        public string VariableLabelPopUp { get; set; }

        [StringLength(60)]
        public string VariableNameSingular { get; set; }

        [StringLength(60)]
        public string VariableNamePlural { get; set; }

        [StringLength(100)]
        public string NumberIncludedLabel { get; set; }

        [StringLength(200)]
        public string NumberIncludedLabelPopUp { get; set; }

        [StringLength(100)]
        public string HourlySurchargeLabel { get; set; }

        [StringLength(100)]
        public string MinNumberAllowedLabel { get; set; }

        [StringLength(200)]
        public string MinNumberAllowedLabelPopUp { get; set; }

        [StringLength(100)]
        public string MaxNumberAllowedLabel { get; set; }

        [StringLength(200)]
        public string MaxNumberAllowedLabelPopUp { get; set; }

        public int? CalculateWithVariableID { get; set; }

        public bool Active { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public string MinMaxValuesList { get; set; }
    }
}
