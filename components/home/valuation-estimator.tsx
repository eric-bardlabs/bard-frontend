import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { TrackMultiSelect, TrackOption } from "@/components/songs/track-multi-select";
import {
  CollaboratorMultiSelect,
} from "@/components/collaborator/collaboratorMultiSelect";
import { CollaboratorSelection } from "@/components/collaborator/types";
import { EarningsInput } from "./earnings-input";
import { useUser, useOrganization, useAuth } from "@clerk/nextjs";
import {
  calculateAverageGenreScore,
  calculateTotalTlm,
  calculateCharacteristicMultiplierRange,
  calculateRevenueMultiplierRange,
  calculateCombinedMultiplier,
  calculateFinalMultiplier,
  calculateValuationRange,
  genreScoreMap,
} from "./valuation-calculations";
import {
  getGenreValuationConsideration,
  getAgeScoreConsideration,
  getConsistencyScoreConsideration,
  formatCurrency,
} from "./valuation-content";
import { Track } from "@/lib/api/tracks";
import {
  fetchMyCollaboratorProfile,
} from "@/lib/api/collaborators";
import { 
  fetchCatalogValuationData, 
  CatalogValuationData 
} from "@/lib/api/valuation";

interface ValuationEstimatorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const ValuationEstimator: React.FC<ValuationEstimatorProps> = ({
  isOpen,
  onOpenChange,
}) => {
  // Get current user from Clerk
  const { user } = useUser();
  const { getToken } = useAuth();

  const { organization } = useOrganization();
  const organizationId = organization?.id;

  // States
  const [adminFee, setAdminFee] = React.useState(15);
  const [totalStreams, setTotalStreams] = React.useState("0");
  const [topFiveStreams, setTopFiveStreams] = React.useState("0");
  const [selectedTracks, setSelectedTracks] = React.useState<TrackOption[]>([]);
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = React.useState<
    CollaboratorSelection[]
  >([]);
  const [proEarnings, setProEarnings] = React.useState({ tlm: 0, lifetime: 0 });
  const [mlcEarnings, setMlcEarnings] = React.useState({ tlm: 0, lifetime: 0 });
  const [streamEarnings, setStreamEarnings] = React.useState({
    tlm: 0,
    lifetime: 0,
  });
  const [otherEarnings, setOtherEarnings] = React.useState({
    tlm: 0,
    lifetime: 0,
  });

  const [manualMultiplier, setManualMultiplier] = React.useState<number | null>(
    null
  );

  // Flag to prevent saving during initial data loading
  const [isLoadingInitialData, setIsLoadingInitialData] = React.useState(true);

  // Manual ownership override
  const [isManualOwnership, setIsManualOwnership] = React.useState(false);
  const [manualOwnershipPercentage, setManualOwnershipPercentage] =
    React.useState<number | null>(null);

  // Backend catalog valuation data
  const [catalogValuationData, setCatalogValuationData] = React.useState<CatalogValuationData | null>(null);
  const [isLoadingCatalogData, setIsLoadingCatalogData] = React.useState(false);
  const [catalogDataError, setCatalogDataError] = React.useState<string | null>(null);

  // Function to fetch catalog valuation data from backend
  const fetchCatalogData = React.useCallback(async () => {
    try {
      setIsLoadingCatalogData(true);
      setCatalogDataError(null);
      
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      const data = await fetchCatalogValuationData({
        token,
        owner_ids: selectedOwners.map(owner => owner.id),
      });

      setCatalogValuationData(data);
    } catch (error) {
      console.error("Error fetching catalog valuation data:", error);
      setCatalogDataError("Failed to load catalog data");
      setCatalogValuationData(null);
    } finally {
      setIsLoadingCatalogData(false);
    }
  }, [selectedOwners]);

  // Fetch catalog data when owner selection changes
  React.useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  // Function to save user inputs to API
  const saveUserInputs = React.useCallback(async () => {
    if (!user?.id || !organizationId) {
      console.error("User ID or organization ID is missing");
      return;
    }

    try {
      const token = await getToken({ template: "bard-backend" });

      const backendHost =
        process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL ||
        "http://localhost:8000";

      const payload = {
        user_id: user?.id,
        organization_id: organizationId,
        catalog_valuation_inputs: {
          adminFee,
          totalStreams,
          topFiveStreams,
          selectedTracks,
          selectedGenres,
          selectedOwners,
          proEarnings,
          mlcEarnings,
          streamEarnings,
          otherEarnings,
          manualMultiplier,
          isManualOwnership,
          manualOwnershipPercentage,
        },
      };

      const response = await fetch(`${backendHost}/catalog-valuation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save inputs");
      }
    } catch (error) {
      console.error("Error saving valuation inputs:", error);
      // Optionally show user feedback here
    }
  }, [
    user?.id,
    organizationId,
    adminFee,
    totalStreams,
    topFiveStreams,
    selectedTracks,
    selectedGenres,
    selectedOwners,
    proEarnings,
    mlcEarnings,
    streamEarnings,
    otherEarnings,
    manualMultiplier,
    isManualOwnership,
    manualOwnershipPercentage,
  ]);

  // Load saved valuation inputs from API
  React.useEffect(() => {
    const loadSavedInputs = async () => {
      if (!user?.id || !organizationId) return;

      try {
        const token = await getToken({ template: "bard-backend" });

        const backendHost =
          process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL ||
          "http://localhost:8000";

        const response = await fetch(`${backendHost}/catalog-valuation`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const inputs = data.catalog_valuation_inputs;

          if (inputs) {
            // Populate form fields with saved data
            if (inputs.adminFee !== undefined) setAdminFee(inputs.adminFee);
            if (inputs.totalStreams !== undefined)
              setTotalStreams(inputs.totalStreams);
            if (inputs.topFiveStreams !== undefined)
              setTopFiveStreams(inputs.topFiveStreams);
            if (inputs.selectedTracks !== undefined)
              setSelectedTracks(inputs.selectedTracks);
            if (inputs.selectedGenres !== undefined)
              setSelectedGenres(inputs.selectedGenres);
            if (inputs.selectedOwners !== undefined)
              setSelectedOwners(inputs.selectedOwners);
            if (inputs.proEarnings !== undefined)
              setProEarnings(inputs.proEarnings);
            if (inputs.mlcEarnings !== undefined)
              setMlcEarnings(inputs.mlcEarnings);
            if (inputs.streamEarnings !== undefined)
              setStreamEarnings(inputs.streamEarnings);
            if (inputs.otherEarnings !== undefined)
              setOtherEarnings(inputs.otherEarnings);
            if (inputs.manualMultiplier !== undefined)
              setManualMultiplier(inputs.manualMultiplier);
            if (inputs.isManualOwnership !== undefined)
              setIsManualOwnership(inputs.isManualOwnership);
            if (inputs.manualOwnershipPercentage !== undefined)
              setManualOwnershipPercentage(inputs.manualOwnershipPercentage);
          }
        }
      } catch (error) {
        console.error("Error loading saved valuation inputs:", error);
      } finally {
        // Mark initial loading as complete
        setIsLoadingInitialData(false);
      }
    };

    loadSavedInputs();
  }, [user?.id, organizationId]);

  // Save inputs whenever they change (debounced) - only after initial loading is complete
  React.useEffect(() => {
    if (isLoadingInitialData) return; // Don't save during initial data loading

    const timeoutId = setTimeout(() => {
      saveUserInputs();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [
    isLoadingInitialData,
    adminFee,
    totalStreams,
    topFiveStreams,
    selectedTracks,
    selectedGenres,
    selectedOwners,
    proEarnings,
    mlcEarnings,
    streamEarnings,
    otherEarnings,
    // Note: manualMultiplier is excluded to avoid saving on every slider movement
    isManualOwnership,
    manualOwnershipPercentage,
  ]);

  // Set default selected owners based on current user's collaborator profile
  React.useEffect(() => {
    const loadMyProfile = async () => {
      if (!getToken) return;

      try {
        const token = await getToken({ template: "bard-backend" });
        if (!token) return;

        const myProfile = await fetchMyCollaboratorProfile({ token });
        if (myProfile) {
          const collaboratorOption: CollaboratorSelection = {
            id: myProfile.id,
            label: myProfile.artist_name || myProfile.legal_name || "",
            subtitle: myProfile.email || "",
          };
          if (selectedOwners.length === 0) {
            setSelectedOwners([collaboratorOption]);
          }
        }
      } catch (error) {
        console.error("Failed to load my collaborator profile:", error);
      }
    };

    loadMyProfile();
  }, [getToken]);

  const allGenres = Object.keys(genreScoreMap);

  //   Handlers
  // Handle genre selection with max 3 limit
  const handleGenreSelection = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  //   Calculations using extracted functions
  const averageGenreScore = React.useMemo(() => {
    return calculateAverageGenreScore(selectedGenres);
  }, [selectedGenres]);

  // Use backend data for these calculations
  const averageAgeScore = React.useMemo(() => {
    return catalogValuationData?.average_age_score ?? 0;
  }, [catalogValuationData]);

  const totalSpanYears = React.useMemo(() => {
    return catalogValuationData?.total_span_years ?? 0;
  }, [catalogValuationData]);

  const consistencyScore = React.useMemo(() => {
    return catalogValuationData?.consistency_score ?? 0;
  }, [catalogValuationData]);

  const totalTrackCount = React.useMemo(() => {
    return catalogValuationData?.total_tracks ?? 0;
  }, [catalogValuationData]);

  const ownershipScore = React.useMemo(() => {
    if (isManualOwnership && manualOwnershipPercentage !== null) {
      // Use manual ownership percentage
      if (manualOwnershipPercentage >= 90) return 5;
      if (manualOwnershipPercentage >= 70) return 4;
      if (manualOwnershipPercentage >= 50) return 3;
      if (manualOwnershipPercentage >= 30) return 2;
      return 1;
    }
    // Use backend computed ownership score
    return catalogValuationData?.ownership_score ?? 1;
  }, [
    isManualOwnership,
    manualOwnershipPercentage,
    catalogValuationData,
  ]);

  // Calculate ownership percentage for display using backend data
  const ownershipPercentage = React.useMemo(() => {
    if (isManualOwnership && manualOwnershipPercentage !== null) {
      return manualOwnershipPercentage;
    }
    
    // Use backend ownership percentage if available
    return catalogValuationData?.ownership_percentage ?? 0;
  }, [
    isManualOwnership,
    manualOwnershipPercentage,
    catalogValuationData,
  ]);

  const characteristicMultiplierRange = React.useMemo(() => {
    return calculateCharacteristicMultiplierRange(
      ownershipScore,
      averageAgeScore,
      consistencyScore,
      averageGenreScore
    );
  }, [ownershipScore, averageAgeScore, consistencyScore, averageGenreScore]);

  const genreValuationInfo = React.useMemo(() => {
    return getGenreValuationConsideration(averageGenreScore);
  }, [averageGenreScore]);

  const ageScoreInfo = React.useMemo(() => {
    return getAgeScoreConsideration(averageAgeScore);
  }, [averageAgeScore]);

  const consistencyScoreInfo = React.useMemo(() => {
    return getConsistencyScoreConsideration(consistencyScore);
  }, [consistencyScore]);

  const totalTlm = React.useMemo(() => {
    return calculateTotalTlm({
      pro: proEarnings,
      mlc: mlcEarnings,
      stream: streamEarnings,
      other: otherEarnings,
    });
  }, [proEarnings, mlcEarnings, streamEarnings, otherEarnings]);

  const revenueMultiplierRange = React.useMemo(() => {
    return calculateRevenueMultiplierRange(
      totalTlm,
      {
        pro: proEarnings,
        mlc: mlcEarnings,
        stream: streamEarnings,
        other: otherEarnings,
      },
      totalStreams,
      topFiveStreams,
      adminFee
    );
  }, [
    totalTlm,
    proEarnings,
    mlcEarnings,
    streamEarnings,
    otherEarnings,
    totalStreams,
    topFiveStreams,
    adminFee
  ]);

  const combinedMultiplier = React.useMemo(() => {
    return calculateCombinedMultiplier(
      totalSpanYears,
      characteristicMultiplierRange,
      revenueMultiplierRange
    );
  }, [totalSpanYears, characteristicMultiplierRange, revenueMultiplierRange]);

  // Reset manual multiplier when user changes inputs that affect the calculation
  React.useEffect(() => {
    setManualMultiplier(null);
  }, [
    topFiveStreams,
    totalStreams,
    proEarnings,
    mlcEarnings,
    streamEarnings,
    otherEarnings,
    selectedGenres,
    selectedOwners,
    adminFee,
  ]);

  const multiplierRange = combinedMultiplier.upper - combinedMultiplier.lower;

  // Get the current multiplier to display (manual if set, otherwise computed)
  const currentMultiplier =
    manualMultiplier ??
    (combinedMultiplier.lower + combinedMultiplier.upper) / 2;

  const finalMultiplier = React.useMemo(() => {
    return calculateFinalMultiplier(manualMultiplier, combinedMultiplier);
  }, [manualMultiplier, combinedMultiplier]);

  const valuationRange = React.useMemo(() => {
    return calculateValuationRange(finalMultiplier, totalTlm, adminFee);
  }, [finalMultiplier, totalTlm, adminFee]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-w-7xl",
        body: "p-0",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 px-6 py-4 border-b border-default-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Icon
                    icon="lucide:calculator"
                    className="h-5 w-5 text-primary-600"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-default-900">
                    Learn about the worth of your catalog
                  </h2>
                  <p className="text-sm text-default-500">
                    Use this tool to estimate the worth of your music catalog.
                    Simply select the tracks, genres, and other data, and we’ll
                    help you calculate your estimated valuation.
                  </p>
                </div>
              </div>
            </ModalHeader>

            {/* Estimated Valuation Range - Prominent Display */}
            <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-primary-100">
              <div className="text-center">
                <p className="text-sm font-medium text-primary-700 mb-1">
                  Estimated Valuation Range
                </p>
                {isLoadingCatalogData ? (
                  <div className="flex items-center justify-center gap-2 h-12">
                    <Icon icon="lucide:loader-2" className="w-6 h-6 animate-spin text-primary-600" />
                    <span className="text-lg font-medium text-primary-700">
                      Updating your valuation...
                    </span>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-primary-800 mb-1">
                    {formatCurrency(valuationRange.lower)} -{" "}
                    {formatCurrency(valuationRange.upper)}
                  </div>
                )}
                <p className="text-sm text-primary-600">
                  Updates automatically as you adjust inputs below
                </p>
              </div>
            </div>

            <ModalBody className="p-0">
              <div className="px-6 py-4">
                {/* Two-column layout for main sections */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Left column - Input Sections */}
                  <div className="space-y-6">
                    {/* Catalog Overview Section */}
                    <div className="bg-white rounded-xl border border-default-200 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon
                            icon="lucide:music"
                            className="h-4 w-4 text-blue-600"
                          />
                        </div>
                        <h3 className="text-base font-semibold text-default-900">
                          Catalog Overview
                        </h3>
                      </div>

                      {/* Genre Selection */}
                      <div className="mb-4">
                        <label className="text-sm font-semibold text-default-700 block mb-2">
                          Genre Selection{" "}
                          <span className="text-default-500 font-normal">
                            (Select up to 3)
                          </span>
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {allGenres.map((genre) => (
                            <Chip
                              key={genre}
                              color={
                                selectedGenres.includes(genre)
                                  ? "primary"
                                  : "default"
                              }
                              variant={
                                selectedGenres.includes(genre)
                                  ? "solid"
                                  : "flat"
                              }
                              className="cursor-pointer text-sm font-medium"
                              size="sm"
                              onClick={() => handleGenreSelection(genre)}
                              isDisabled={
                                !selectedGenres.includes(genre) &&
                                selectedGenres.length >= 3
                              }
                            >
                              {genre}
                            </Chip>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-default-600">
                            <span className="font-medium">Selected:</span>{" "}
                            {selectedGenres.length > 0
                              ? selectedGenres.join(", ")
                              : "None selected"}
                          </p>
                          <span className="text-xs text-default-500 bg-default-100 px-2 py-1 rounded-full">
                            {selectedGenres.length}/3
                          </span>
                        </div>
                      </div>

                      {/* Catalog Ownership */}
                      <div className="mb-4">
                        <label className="text-sm font-semibold text-default-700 block mb-3">
                          Who are the owners of this catalog?
                        </label>
                        <>
                          <CollaboratorMultiSelect
                            title="Select Catalog Owners"
                            defaultSelected={selectedOwners}
                            setSelected={(options) => {
                              setSelectedOwners(options);
                            }}
                            maxItems={10}
                          />

                          {/* Simple ownership display */}
                          {selectedOwners.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-default-500">
                                  Overall ownership:{" "}
                                  {isLoadingCatalogData ? (
                                    <span className="text-default-400">Updating...</span>
                                  ) : (
                                    `${ownershipPercentage.toFixed(2)}%`
                                  )}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsManualOwnership(!isManualOwnership);
                                    if (
                                      !isManualOwnership &&
                                      manualOwnershipPercentage === null
                                    ) {
                                      // Set initial manual value to computed value
                                      setManualOwnershipPercentage(ownershipPercentage);
                                    }
                                  }}
                                  className="text-xs text-primary-600 hover:text-primary-700 underline"
                                >
                                  {isManualOwnership
                                    ? "Revert"
                                    : "Enter manually"}
                                </button>
                              </div>

                              {isManualOwnership && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Enter percentage"
                                    value={
                                      manualOwnershipPercentage?.toString() ||
                                      ""
                                    }
                                    onValueChange={(value) =>
                                      setManualOwnershipPercentage(
                                        Number(value)
                                      )
                                    }
                                    min={0}
                                    max={100}
                                    step={0.01}
                                    size="sm"
                                    classNames={{
                                      input: "text-xs h-8",
                                      inputWrapper: "h-8",
                                    }}
                                  />
                                  <span className="text-xs text-default-500">
                                    %
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      </div>

                      {/* Consideration Blocks */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-default-700">
                            Valuation Considerations
                          </h4>
                          {isLoadingCatalogData && (
                            <div className="flex items-center gap-1 text-xs text-default-500">
                              <Icon icon="lucide:loader-2" className="w-3 h-3 animate-spin" />
                              Updating your valuation...
                            </div>
                          )}
                        </div>

                        {/* Genre Valuation Consideration */}
                        {genreValuationInfo && (
                          <div
                            className={`p-3 rounded-lg border-l-4 ${
                              averageGenreScore >= 4
                                ? "bg-success-50 border-success-400"
                                : averageGenreScore >= 2
                                  ? "bg-primary-50 border-primary-400"
                                  : "bg-warning-50 border-warning-400"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Icon
                                icon="lucide:trending-up"
                                className={`h-4 w-4 mt-0.5 ${
                                  averageGenreScore >= 4
                                    ? "text-success-500"
                                    : averageGenreScore >= 2
                                      ? "text-primary-500"
                                      : "text-warning-500"
                                }`}
                              />
                              <div className="flex-1">
                                <p
                                  className={`text-sm font-semibold mb-1 ${
                                    averageGenreScore >= 4
                                      ? "text-success-700"
                                      : averageGenreScore >= 2
                                        ? "text-primary-700"
                                        : "text-warning-700"
                                  }`}
                                >
                                  {genreValuationInfo.title}
                                </p>
                                <p
                                  className={`text-sm ${
                                    averageGenreScore >= 4
                                      ? "text-success-600"
                                      : averageGenreScore >= 2
                                        ? "text-primary-600"
                                        : "text-warning-600"
                                  }`}
                                >
                                  {genreValuationInfo.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Age Score Consideration */}
                        {ageScoreInfo && (
                          <div
                            className={`p-3 rounded-lg border-l-4 ${
                              averageAgeScore >= 4
                                ? "bg-success-50 border-success-400"
                                : averageAgeScore >= 2
                                  ? "bg-primary-50 border-primary-400"
                                  : "bg-warning-50 border-warning-400"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Icon
                                icon="lucide:calendar"
                                className={`h-4 w-4 mt-0.5 ${
                                  averageAgeScore >= 4
                                    ? "text-success-500"
                                    : averageAgeScore >= 2
                                      ? "text-primary-500"
                                      : "text-warning-500"
                                }`}
                              />
                              <div className="flex-1">
                                <p
                                  className={`text-sm font-semibold mb-1 ${
                                    averageAgeScore >= 4
                                      ? "text-success-700"
                                      : averageAgeScore >= 2
                                        ? "text-primary-700"
                                        : "text-warning-700"
                                  }`}
                                >
                                  {ageScoreInfo.title}
                                </p>
                                <p
                                  className={`text-sm ${
                                    averageAgeScore >= 4
                                      ? "text-success-600"
                                      : averageAgeScore >= 2
                                        ? "text-primary-600"
                                        : "text-warning-600"
                                  }`}
                                >
                                  {ageScoreInfo.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Consistency Score Consideration */}
                        {consistencyScoreInfo && (
                          <div
                            className={`p-3 rounded-lg border-l-4 ${
                              consistencyScore >= 4
                                ? "bg-success-50 border-success-400"
                                : consistencyScore >= 2
                                  ? "bg-primary-50 border-primary-400"
                                  : "bg-warning-50 border-warning-400"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Icon
                                icon="lucide:repeat"
                                className={`h-4 w-4 mt-0.5 ${
                                  consistencyScore >= 4
                                    ? "text-success-500"
                                    : consistencyScore >= 2
                                      ? "text-primary-500"
                                      : "text-warning-500"
                                }`}
                              />
                              <div className="flex-1">
                                <p
                                  className={`text-sm font-semibold mb-1 ${
                                    consistencyScore >= 4
                                      ? "text-success-700"
                                      : consistencyScore >= 2
                                        ? "text-primary-700"
                                        : "text-warning-700"
                                  }`}
                                >
                                  {consistencyScoreInfo.title}
                                </p>
                                <p
                                  className={`text-sm ${
                                    consistencyScore >= 4
                                      ? "text-success-600"
                                      : consistencyScore >= 2
                                        ? "text-primary-600"
                                        : "text-warning-600"
                                  }`}
                                >
                                  {consistencyScoreInfo.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Streaming Data Section */}
                    <div className="bg-white rounded-xl border border-default-200 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Icon
                            icon="lucide:bar-chart-3"
                            className="h-4 w-4 text-purple-600"
                          />
                        </div>
                        <h3 className="text-base font-semibold text-default-900">
                          Streaming Data
                        </h3>
                      </div>

                      {/* Track Selection */}
                      {totalTrackCount > 0 ? (
                        <div className="mb-4">
                          <label className="text-sm font-semibold text-default-700 mb-2 block">
                            Select Tracks for Valuation
                          </label>
                          <TrackMultiSelect
                            title="Select from Songs"
                            defaultSelected={selectedTracks}
                            setSelected={(options: TrackOption[]) => {
                              setSelectedTracks(options);
                            }}
                            maxItems={5}
                          />
                        </div>
                      ) : (
                        <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Icon
                              icon="lucide:alert-triangle"
                              className="h-4 w-4 text-warning-500 mt-0.5"
                            />
                            <div>
                              <p className="text-sm font-semibold text-warning-700 mb-1">
                                No Released Tracks Available
                              </p>
                              <p className="text-sm text-warning-600">
                                Only tracks with "Release" status are included
                                in valuation calculations. Tracks in other
                                statuses (Draft, Pending, etc.) are not
                                considered.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Input
                            label="Top 5 Songs Streams"
                            placeholder="Enter total streams"
                            value={topFiveStreams}
                            onValueChange={setTopFiveStreams}
                            startContent={
                              <Icon
                                icon="lucide:music"
                                className="h-4 w-4 text-default-400"
                              />
                            }
                            type="number"
                            size="md"
                            classNames={{
                              label: "text-sm font-semibold text-default-700",
                              input: "text-sm",
                            }}
                          />
                        </div>
                        <div>
                          <Input
                            label="Total Streams"
                            placeholder="Enter total streams"
                            value={totalStreams}
                            onValueChange={setTotalStreams}
                            startContent={
                              <Icon
                                icon="lucide:music"
                                className="h-4 w-4 text-default-400"
                              />
                            }
                            type="number"
                            size="md"
                            classNames={{
                              label: "text-sm font-semibold text-default-700",
                              input: "text-sm",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column - Earnings and Multiplier */}
                  <div className="space-y-6">
                    {/* Earnings Multiplier Section */}
                    <div className="bg-white rounded-xl border border-default-200 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Icon
                            icon="lucide:trending-up"
                            className="h-4 w-4 text-orange-600"
                          />
                        </div>
                        <h3 className="text-base font-semibold text-default-900">
                          Earnings Multiplier
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-default-700">
                            Multiplier Range
                          </label>
                          <span className="text-base font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg">
                            {finalMultiplier.lower}x - {finalMultiplier.upper}x
                          </span>
                        </div>

                        <div className="relative">
                          {/* Custom slider implementation */}
                          <div className="relative">
                            <input
                              type="range"
                              min="0"
                              max="30"
                              step="0.5"
                              value={currentMultiplier}
                              onChange={(e) =>
                                setManualMultiplier(Number(e.target.value))
                              }
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${(currentMultiplier / 30) * 100}%, #e2e8f0 ${(currentMultiplier / 30) * 100}%, #e2e8f0 100%)`,
                              }}
                            />

                            {/* Range indicator around thumb */}
                            {/* <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none">
                              <div
                                className="h-2 bg-blue-400 rounded-full opacity-100 border border-blue-600"
                                style={{
                                  width: `${(multiplierRange / 30) * 100}%`,
                                  marginLeft: `${((currentMultiplier - multiplierRange / 2) / 30) * 100}%`,
                                }}
                              />
                            </div> */}

                            {/* Custom CSS for the range input */}
                            <style jsx>{`
                              input[type="range"]::-webkit-slider-thumb {
                                appearance: none;
                                height: 20px;
                                width: 20px;
                                border-radius: 50%;
                                background: #2563eb;
                                border: 2px solid white;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                cursor: pointer;
                              }

                              input[type="range"]::-moz-range-thumb {
                                height: 20px;
                                width: 20px;
                                border-radius: 50%;
                                background: #2563eb;
                                border: 2px solid white;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                cursor: pointer;
                              }

                              input[type="range"]::-webkit-slider-track {
                                background: transparent;
                              }

                              input[type="range"]::-moz-range-track {
                                background: transparent;
                              }
                            `}</style>
                          </div>
                        </div>

                        <div className="flex justify-between text-xs text-default-500 font-medium">
                          <span className="bg-default-100 px-2 py-1 rounded">
                            Emerging
                          </span>
                          <span className="bg-default-100 px-2 py-1 rounded">
                            Indie
                          </span>
                          <span className="bg-default-100 px-2 py-1 rounded">
                            Established
                          </span>
                          <span className="bg-default-100 px-2 py-1 rounded">
                            Major
                          </span>
                        </div>

                        {/* <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <Icon
                              icon="lucide:info"
                              className="h-4 w-4 text-blue-500 mt-0.5"
                            />
                            <div>
                              <p className="text-sm font-medium text-blue-700 mb-1">
                                Multiplier Guidance
                              </p>
                              <p className="text-sm text-blue-600">
                                {getMultiplierGuidance(finalMultiplier)}
                              </p>
                            </div>
                          </div>
                        </div> */}
                      </div>
                    </div>

                    {/* Earnings Section */}
                    <div className="bg-white rounded-xl border border-default-200 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Icon
                            icon="lucide:dollar-sign"
                            className="h-4 w-4 text-green-600"
                          />
                        </div>
                        <h3 className="text-base font-semibold text-default-900">
                          Earnings Data
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <EarningsInput
                          label="PRO Earnings"
                          icon="lucide:dollar-sign"
                          values={proEarnings}
                          onChange={setProEarnings}
                        />

                        <EarningsInput
                          label="MLC Earnings"
                          icon="lucide:landmark"
                          values={mlcEarnings}
                          onChange={setMlcEarnings}
                        />

                        <EarningsInput
                          label="Streams Earnings"
                          icon="lucide:music"
                          values={streamEarnings}
                          onChange={setStreamEarnings}
                        />

                        <EarningsInput
                          label="Other Licensing Earnings"
                          icon="lucide:file-text"
                          values={otherEarnings}
                          onChange={setOtherEarnings}
                        />

                        {/* Admin Fee */}
                        <div>
                          <Input
                            label="Admin Fee Percentage"
                            placeholder="Enter admin fee percentage"
                            value={adminFee.toString()}
                            onValueChange={(value) =>
                              setAdminFee(Number(value))
                            }
                            endContent={
                              <div className="pointer-events-none flex items-center">
                                <span className="text-default-400 font-medium">
                                  %
                                </span>
                              </div>
                            }
                            type="number"
                            min={0}
                            max={100}
                            size="md"
                            classNames={{
                              label: "text-sm font-semibold text-default-700",
                              input: "text-sm",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="px-6 py-3 border-t border-default-200">
              <Button
                color="default"
                variant="light"
                onPress={onClose}
                size="md"
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
