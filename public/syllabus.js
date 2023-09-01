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
    EnvironmentalPollutionAdaptationAndAnimalBehaviorApplicationOfZoology: 2,
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
    GeometricalOpticsAndPhysicalOptics: 6,
    CurrentElectricityAndMagnetism: 9,
    SoundWavesElectrostaticsAndCapacitors: 6,
    ModernPhysicsAndNuclearPhysics: 6,
    SolidAndSemiconductorDevices: 4,
    ParticlePhysicsSourceOfEnergyAndUniverse: 3,
  },
  mat: {
    VerbalReasoning: 5,
    NumericalReasoning: 5,
    LogicalSequencing: 5,
    SpatialRelationAbstractReasoning: 5,
  },
};

const MECSYLLABUS = {
  subjects: [
    {
      name: "zoology",
      questions: 40,
      units: [
        {
          unit: "Biology, origin and evolution of life",
          topics: ["Biology", "origin and evolution of life"],
          questions: 4,
          mergedunit: "BiologyOriginAndEvolutionOfLife",
        },
        {
          unit: "General characteristics and classification",
          topics: [
            "General characteristics",
            "classification of protozoa to chordata",
          ],
          questions: 8,
          mergedunit: "GeneralCharacteristicsAndClassification",
        },
        {
          unit: "Plasmodium, earthworm and frog",
          topics: ["Plasmodium", "earthworm", "frog"],
          questions: 8,
          mergedunit: "PlasmodiumEarthwormAndFrog",
        },
        {
          unit: "Human biology and human diseases",
          topics: ["Human biology", "human diseases"],
          questions: 14,
          mergedunit: "HumanBiologyAndHumanDiseases",
        },
        {
          unit: "Animal tissues",
          topics: ["Animal tissues"],
          questions: 4,
          mergedunit: "AnimalTissues",
        },
        {
          unit: "Environmental pollution, adaptation and animal behavior, application of zoology",
          topics: [
            "Environmental pollution",
            "adaptation",
            "animal behavior",
            "application of zoology",
          ],
          questions: 2,
          mergedunit:
            "EnvironmentalPollutionAdaptationAndAnimalBehaviorApplicationOfZoology",
        },
      ],
    },
    {
      name: "botany",
      questions: 40,
      units: [
        {
          unit: "Basic component of life and biodiversity",
          topics: ["Basic component of life", "biodiversity"],
          questions: 11,
          mergedunit: "BasicComponentOfLifeAndBiodiversity",
        },
        {
          unit: "Ecology and environment",
          topics: ["Ecology", "environment"],
          questions: 5,
          mergedunit: "EcologyAndEnvironment",
        },
        {
          unit: "Cell biology and genetics",
          topics: ["Cell biology", "genetics"],
          questions: 12,
          mergedunit: "CellBiologyAndGenetics",
        },
        {
          unit: "Anatomy and physiology",
          topics: ["Anatomy", "physiology"],
          questions: 7,
          mergedunit: "AnatomyAndPhysiology",
        },
        {
          unit: "Developmental and applied botany",
          topics: ["Developmental botany", "applied botany"],
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
          topics: ["General chemistry", "physical chemistry"],
          questions: 18,
          mergedunit: "GeneralAndPhysicalChemistry",
        },
        {
          unit: "Inorganic chemistry",
          topics: ["Inorganic chemistry"],
          questions: 14,
          mergedunit: "InorganicChemistry",
        },
        {
          unit: "Organic chemistry",
          topics: ["Organic chemistry"],
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
          topics: ["Mechanics"],
          questions: 10,
          mergedunit: "Mechanics",
        },
        {
          unit: "Heat and thermodynamics",
          topics: ["Heat", "thermodynamics"],
          questions: 6,
          mergedunit: "HeatAndThermodynamics",
        },
        {
          unit: "Geometrical optics and physical optics",
          topics: ["Geometrical optics", "physical optics"],
          questions: 6,
          mergedunit: "GeometricalOpticsAndPhysicalOptics",
        },
        {
          unit: "Current electricity and magnetism",
          topics: ["Current electricity", "magnetism"],
          questions: 9,
          mergedunit: "CurrentElectricityAndMagnetism",
        },
        {
          unit: "Sound waves, electrostatics and capacitors",
          topics: ["Sound waves", "electrostatics", "capacitors"],
          questions: 6,
          mergedunit: "SoundWavesElectrostaticsAndCapacitors",
        },
        {
          unit: "Modern physics and nuclear physics",
          topics: ["Modern physics", "nuclear physics"],
          questions: 6,
          mergedunit: "ModernPhysicsAndNuclearPhysics",
        },
        {
          unit: "Solid and semiconductor devices",
          topics: ["Solid state devices", "semiconductor devices"],
          questions: 4,
          mergedunit: "SolidAndSemiconductorDevices",
        },
        {
          unit: "Particle physics, source of energy and universe",
          topics: ["Particle physics", "source of energy", "universe"],
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
          unit: "Verbal reasoning",
          topics: ["Verbal reasoning"],
          questions: 5,
          mergedunit: "VerbalReasoning",
        },
        {
          unit: "Numerical reasoning",
          topics: ["Numerical reasoning"],
          questions: 5,
          mergedunit: "NumericalReasoning",
        },
        {
          unit: "Logical sequencing",
          topics: ["Logical sequencing"],
          questions: 5,
          mergedunit: "LogicalSequencing",
        },
        {
          unit: "Spatial relation / Abstract reasoning",
          topics: ["Spatial relation", "Abstract reasoning"],
          questions: 5,
          mergedunit: "SpatialRelationAbstractReasoning",
        },
      ],
    },
  ],
};

module.exports = { SUBJECTWEIGHTAGE, UNITWEIGHTAGE, MECSYLLABUS };
