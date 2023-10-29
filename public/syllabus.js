const SUBJECTWEIGHTAGE = {
  zoology: 40,
  botany: 40,
  chemistry: 50,
  physics: 50,
  mat: 20,
};

const UNITWEIGHTAGE = {
  zoology: {
    BiologyOriginAndEvolutionOfLife: 4,
    GeneralCharacteristicsAndClassification: 8,
    PlasmodiumEarthwormAndFrog: 8,
    HumanBiologyAndHumanDiseases: 14,
    AnimalTissues: 4,
    EnvironmentAnimalBehaviorAndAdaptation: 2,
  },
  botany: {
    BasicComponentOfLifeAndBiodiversity: 11,
    EcologyAndEnvironment: 5,
    CellBiologyAndGenetics: 12,
    AnatomyAndPhysiology: 7,
    DevelopmentalAndAppliedBotany: 5,
  },
  chemistry: {
    GeneralAndPhysicalChemistry: 18,
    InorganicChemistry: 14,
    OrganicChemistry: 18,
  },
  physics: {
    Mechanics: 10,
    HeatAndThermodynamics: 6,
    GeometricalAndPhysicalOptics: 6,
    CurrentElectricityAndMagnetism: 9,
    SoundWavesElectrostaticsAndCapacitors: 6,
    ModernPhysicsAndNuclearPhysics: 6,
    SolidAndSemiconductorDevices: 4,
    ParticlePhysicsSourceOfEnergyAndUniverse: 3,
  },
  mat: {
    NumericalReasoning1: 2,
    NumericalReasoning2: 1,
    NumericalReasoning3: 2,
    VerbalReasoning1: 1,
    VerbalReasoning2: 2,
    VerbalReasoning3: 2,
    LogicalSequencing1: 2,
    LogicalSequencing2: 2,
    LogicalSequencing3: 1,
    SpatialRelation1: 4,
    SpatialRelation2: 1,
    SpatialRelation3: 0,
  },
};

const UPDATED_SYLLABUS = {
  subjects: [
    {
      name: "zoology",
      questions: 40,
      units: [
        {
          unit: "Biology, origin and evolution of life",
          topics: ["Origin and Evolution of Life"],
          questions: 4,
          mergedunit: "BiologyOriginAndEvolutionOfLife",
        },
        {
          unit: "General characteristics and classification",
          topics: [
            "Classification of Animals",
            "Protozoa",
            "Paramecium",
            "Porifera",
            "Cnidaria",
            "Platyhelminthes",
            "Aschelminthes",
            "Annelida",
            "Arthropoda",
            "Mollusca",
            "Echinodermata",
            "Chordata",
            "viruses",
            "fungi",
            "Cockroach",
          ],
          questions: 8,
          mergedunit: "GeneralCharacteristicsAndClassification",
        },
        {
          unit: "Environmental pollution, adaptation and animal behavior, application of zoology",
          topics: [
            "Animal Behavior and Adaptation",
            "Application of zoology",
            "Environmental Pollution",
          ],
          questions: 2,
          mergedunit: "EnvironmentAnimalBehaviorAndAdaptation",
        },
        {
          unit: "Plasmodium, earthworm and frog",
          topics: ["Plasmodium", "Earthworm", "Frog", "Rabbit"],
          questions: 8,
          mergedunit: "PlasmodiumEarthwormAndFrog",
        },
        {
          unit: "Human biology and human diseases",
          topics: [
            "Endocrinology",
            "Digestive System",
            "Respiratory System",
            "Cardiovascular System",
            "Nervous System",
            "Sense Organs",
            "Reproductive System",
            "Embryonic Development",
            "Excretory System",
            "Human Diseases And Immunology",
            "Biomolecules",
            "Skeletal System",
          ],
          questions: 14,
          mergedunit: "HumanBiologyAndHumanDiseases",
        },
        {
          unit: "Animal tissues",
          topics: ["Animal Tissues"],
          questions: 4,
          mergedunit: "AnimalTissues",
        },
      ],
    },
    {
      name: "botany",
      questions: 40,
      units: [
        {
          unit: "Basic component of life and biodiversity",
          topics: [
            "Plant Diversity",
            "Virus",
            "Bacteria",
            "Algae",
            "Fungi",
            "Lichens",
            "Bryophyta",
            "Pteridophyta",
            "Gymnosperms",
            "Morphology of Angiosperm",
            "Taxonomy of Angiosperms",
          ],
          questions: 11,
          mergedunit: "BasicComponentOfLifeAndBiodiversity",
        },
        {
          unit: "Ecology and environment",
          topics: ["Ecology"],
          questions: 5,
          mergedunit: "EcologyAndEnvironment",
        },
        {
          unit: "Cell biology and genetics",
          topics: [
            "Cytology",
            "Cell Biology",
            "Cell Division",
            "Biomolecule",
            "Genetics",
            "Enzymes",
          ],
          questions: 12,
          mergedunit: "CellBiologyAndGenetics",
        },
        {
          unit: "Anatomy and physiology",
          topics: [
            "Plant Anatomy",
            "Plant Water Relation",
            "Mineral",
            "Photosynthesis",
            "Respiration",
            "Plant Hormones",
            "Plant Movement",
            "Special Modes of Nutrition",
          ],
          questions: 7,
          mergedunit: "AnatomyAndPhysiology",
        },
        {
          unit: "Developmental and applied botany",
          topics: [
            "Reproduction in Flowering Plants",
            "Application of Biology",
          ],
          questions: 5,
          mergedunit: "DevelopmentalAndAppliedBotany",
        },
      ],
    },
    {
      name: "chemistry",
      questions: 50,
      units: [
        {
          unit: "General and physical chemistry",
          topics: [
            "Stoichiometry",
            "Chemical Calculation",
            "Atomic Structure",
            "Radioactivity",
            "Chemical Bonding",
            "Oxidation and Reduction",
            "Acids, Bases and Salts",
            "Gaseous and Liquid States",
            "Solid State",
            "Colloids and Catalysis",
            "Volumetric Analysis",
            "Chemical Equilibrium",
            "Ionic Equilibrium",
            "Solutions",
            "Chemical Kinetics",
            "Electrochemistry",
            "Thermodynamics",
          ],
          questions: 18,
          mergedunit: "GeneralAndPhysicalChemistry",
        },
        {
          unit: "Inorganic chemistry",
          topics: [
            "Hydrogen",
            "Alkali Metals",
            "Alkaline Earth Metals",
            "Boron",
            "Carbon",
            "Nitrogen",
            "Oxygen",
            "Halogen",
            "Noble Gases",
            "Metals and Metallurgy",
            "Heavy Metals",
            "Transition Metal",
            "Coordination Chemistry",
            "Qualitative Analysis",
            "Cement",
            "Paper and Pulp",
          ],
          questions: 14,
          mergedunit: "InorganicChemistry",
        },
        {
          unit: "Organic chemistry",
          topics: [
            "Basic Principles",
            "Purification and Characterization",
            "Nomenclature",
            "Isomerism",
            "Reaction Mechanism",
            "Hydrocarbons",
            "Halogen Derivatives",
            "Alcohol",
            "Phenols",
            "Ether",
            "Carbonyl Compounds",
            "Carboxylic Acids",
            "Compounds Containing Nitrogen",
            "Molecules of Life",
            "Polymer And Polymerization",
            "Chemistry in Action",
            "Organometallic Compounds",
          ],
          questions: 18,
          mergedunit: "OrganicChemistry",
        },
      ],
    },
    {
      name: "physics",
      questions: 50,
      units: [
        {
          unit: "Mechanics",
          topics: [
            "Units Dimensions Errors",
            "Vectors and Scalars",
            "Motion in a Straight Line",
            "Projectile Motion",
            "Laws of Motion",
            "Friction",
            "Work Energy Power and Collision",
            "Circular Motion",
            "Gravitation",
            "Rotational Motion",
            "Simple Harmonic Motion",
            "Elasticity",
            "Surface Tension",
            "Fluid Dynamics and Viscosity",
            "Hydrostatics",
          ],
          questions: 10,
          mergedunit: "Mechanics",
        },
        {
          unit: "Heat and thermodynamics",
          topics: [
            "Thermometry",
            "Thermal Expansion",
            "Calorimetry",
            "Hygrometry",
            "Kinetic Theory of Gases",
            "Transmission of Heat",
            "Thermodynamics",
          ],
          questions: 6,
          mergedunit: "HeatAndThermodynamics",
        },
        {
          unit: "Geometrical optics and physical optics",
          topics: [
            "Reflection and Refraction",
            "Total Internal Reflection",
            "Prism",
            "Dispersion of Light",
            "Lenses",
            "Chromatic Aberration",
            "Optical Instruments",
            "Human Eye",
            "Velocity of Light",
            "Photometry",
            "Interference",
            "Diffraction",
            "Polarization",
          ],
          questions: 6,
          mergedunit: "GeometricalAndPhysicalOptics",
        },
        {
          unit: "Current electricity and magnetism",
          topics: [
            "Electric Current",
            "Heating Effects of Current",
            "Thermoelectricity",
            "Chemical Effects of Current",
            "Meters",
            "Magnetism",
            "Magnetic Effects of Current",
            "Electromagnetic Induction",
            "Alternating Current",
          ],
          questions: 9,
          mergedunit: "CurrentElectricityAndMagnetism",
        },
        {
          unit: "Sound waves, electrostatics and capacitors",
          topics: [
            "Charge and Force",
            "Electric Field and Potential",
            "Capacitance",
            "Doppler effect and sound waves",
          ],
          questions: 6,
          mergedunit: "SoundWavesElectrostaticsAndCapacitors",
        },
        {
          unit: "Modern physics and nuclear physics",
          topics: [
            "Cathode Rays",
            "Positive Rays and Electrons",
            "Photoelectric Effect",
            "X-Rays",
            "Atomic Structure and Spectrum",
            "Radioactivity",
            "Nuclear Physics",
          ],
          questions: 6,
          mergedunit: "ModernPhysicsAndNuclearPhysics",
        },
        {
          unit: "Solid and semiconductor devices",
          topics: ["Semiconductors", "Diode Valves", "Logic Gate"],
          questions: 4,
          mergedunit: "SolidAndSemiconductorDevices",
        },
        {
          unit: "Particle physics, source of energy and universe",
          topics: [
            "Relativistic Physics",
            "Particle Physics",
            "Universe and Source of Energy",
          ],
          questions: 3,
          mergedunit: "ParticlePhysicsSourceOfEnergyAndUniverse",
        },
      ],
    },
    {
      name: "mat",
      questions: 20,
      units: [
        {
          unit: "Numerical Reasoning 1",
          topics: [
            "Train Problems",
            "Boat Problem",
            "Height and Distance",
            "Time and Work",
            "Speed and Distance",
          ],
          questions: 2,
          mergedunit: "NumericalReasoning1",
        },
        {
          unit: "Numerical Reasoning 2",
          topics: [
            "Percentage",
            "Profit and Loss",
            "Simple Interest",
            "Age",
            "Ratio and Proportion",
            "Average",
          ],
          questions: 1,
          mergedunit: "NumericalReasoning2",
        },
        {
          unit: "Numerical Reasoning 3",
          topics: [
            "Permutation and Combination",
            "Probability",
            "Calender",
            "Arithmetic Reasoning",
            "Partnership",
          ],
          questions: 2,
          mergedunit: "NumericalReasoning3",
        },
        {
          unit: "Verbal Reasoning 1",
          topics: ["Coding and Decoding", "Ranking Order", "Verbal Analogy"],
          questions: 1,
          mergedunit: "VerbalReasoning1",
        },
        {
          unit: "Verbal Reasoning 2",
          topics: [
            "Synonyms",
            "Antonyms",
            "Spotting Errors",
            "Spelling Words",
            "Change of Voice",
            "Change of Speech",
            "Selecting Words",
          ],
          questions: 2,
          mergedunit: "VerbalReasoning2",
        },
        {
          unit: "Verbal Reasoning 3",
          topics: [
            "Arithmetic Operation",
            "Idioms and Phrases",
            "Statement Completion",
            "Sentence Correction",
            "One Word Substitute",
          ],
          questions: 2,
          mergedunit: "VerbalReasoning3",
        },
        {
          unit: "Logical Sequencing 1",
          topics: [
            "Number Series",
            "Alphabet Series",
            "Seating Arrangement",
            "Direction and Distance",
            "Verification of Truth",
          ],
          questions: 2,
          mergedunit: "LogicalSequencing1",
        },
        {
          unit: "Logical Sequencing 2",
          topics: [
            "Logical Sequence of Words",
            "Verbal Classification",
            "Artificial Language",
            "Syllogism",
            "Classification",
          ],
          questions: 2,
          mergedunit: "LogicalSequencing2",
        },
        {
          unit: "Logical Sequencing 3",
          topics: [
            "Blood Relations",
            "Letter and Symbol Series",
            "Essential Part",
          ],
          questions: 1,
          mergedunit: "LogicalSequencing3",
        },
        {
          unit: "Spatial Relation 1",
          topics: ["Area", "Basic Maths"],
          questions: 4,
          mergedunit: "SpatialRelation1",
        },
        {
          unit: "Spatial Relation 2",
          topics: ["Volume and Surface Area"],
          questions: 1,
          mergedunit: "SpatialRelation2",
        },
        {
          unit: "Spatial Relation 3",
          topics: ["Abstract Reasoning", "Spatial Relation"],
          questions: 0,
          mergedunit: "SpatialRelation3",
        },
      ],
    },
  ],
};

const data_series_subjectwise = {
  "2023-10-29": {
    subject: "zoology",
    marks: "40",
  },
  "2023-10-30": {
    subject: "botany",
    marks: "40",
  },
  "2023-10-31": {
    subject: "physics",
    marks: "50",
  },
  "2023-11-01": {
    subject: "chemistry",
    marks: "50",
  },
  "2023-11-02": {
    subject: "mat",
    marks: "20",
  },
};

module.exports = {
  SUBJECTWEIGHTAGE,
  UNITWEIGHTAGE,
  UPDATED_SYLLABUS,
  data_series_subjectwise,
};
