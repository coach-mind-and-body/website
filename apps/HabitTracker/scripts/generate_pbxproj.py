"""Generate a valid Xcode project. Run from apps/HabitTracker: python scripts/generate_pbxproj.py"""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

APP_SWIFT = [
    "HabitTracker/HabitTrackerApp.swift",
    "HabitTracker/Config/AppConfig.swift",
    "HabitTracker/Core/AppGroup.swift",
    "HabitTracker/Core/Theme.swift",
    "HabitTracker/Core/YouTubeEmbed.swift",
    "HabitTracker/Core/KeychainStore.swift",
    "HabitTracker/Core/GuestLocalStore.swift",
    "HabitTracker/Core/Models.swift",
    "HabitTracker/Core/API/SuperJSON.swift",
    "HabitTracker/Core/API/APIError.swift",
    "HabitTracker/Core/API/TRPCClient.swift",
    "HabitTracker/Core/Auth/AuthStore.swift",
    "HabitTracker/Core/Health/HealthKitService.swift",
    "HabitTracker/Core/Notifications/NotificationService.swift",
    "HabitTracker/Features/Auth/LoginView.swift",
    "HabitTracker/Features/Root/MainTabView.swift",
    "HabitTracker/Features/Habits/HabitsView.swift",
    "HabitTracker/Features/Habits/HabitsViewModel.swift",
    "HabitTracker/Features/Habits/HabitProgressView.swift",
    "HabitTracker/Features/Food/FoodViewModel.swift",
    "HabitTracker/Features/Food/RecipesView.swift",
    "HabitTracker/Features/Food/MealPlanView.swift",
    "HabitTracker/Features/Food/CaloriesView.swift",
    "HabitTracker/Features/Fitness/FitnessView.swift",
    "HabitTracker/Features/Podcast/PodcastView.swift",
    "HabitTracker/Features/Coach/CoachView.swift",
    "HabitTracker/Features/Coach/CoachInboxView.swift",
    "HabitTracker/Features/Profile/ProfileView.swift",
    "HabitTracker/Features/Intents/HabitAppIntents.swift",
    "Shared/WidgetSnapshot.swift",
]

WIDGET_SWIFT = [
    "HabitTrackerWidget/HabitTrackerWidget.swift",
    "HabitTrackerWidget/HabitTrackerWidgetBundle.swift",
    "Shared/WidgetSnapshot.swift",
    "HabitTracker/Config/AppConfig.swift",
    "HabitTracker/Core/AppGroup.swift",
]


def uid(name: str) -> str:
    return hashlib.sha1(name.encode()).hexdigest()[:24].upper()


def main() -> None:
    refs = []
    app_build = []
    widget_build = []
    file_refs_by_path = {}

    for path in APP_SWIFT:
        i = uid("ref:" + path)
        b = uid("build-app:" + path)
        file_refs_by_path[path] = i
        refs.append(
            f'\t\t{i} /* {Path(path).name} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {Path(path).name}; sourceTree = "<group>"; }};'
        )
        app_build.append(
            f"\t\t{b} /* {Path(path).name} in Sources */ = {{isa = PBXBuildFile; fileRef = {i} /* {Path(path).name} */; }};"
        )

    for path in WIDGET_SWIFT:
        i = file_refs_by_path.get(path) or uid("ref:" + path)
        if path not in file_refs_by_path:
            file_refs_by_path[path] = i
            refs.append(
                f'\t\t{i} /* {Path(path).name} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {Path(path).name}; sourceTree = "<group>"; }};'
            )
        b = uid("build-wid:" + path)
        widget_build.append(
            f"\t\t{b} /* {Path(path).name} in Sources */ = {{isa = PBXBuildFile; fileRef = {i} /* {Path(path).name} */; }};"
        )

    assets = uid("ref:assets")
    entitlements = uid("ref:ent")
    widget_ent = uid("ref:went")
    privacy = uid("ref:priv")
    app_product = uid("ref:app-product")
    widget_product = uid("ref:wid-product")
    health_fw = uid("ref:healthkit")
    widget_fw = uid("ref:widgetkit")
    health_link = uid("build:healthkit")
    widget_link_app = uid("build:widgetkit-app")
    widget_link_ext = uid("build:widgetkit-ext")
    embed_widget = uid("build:embed-widget")
    assets_build = uid("build:assets")

    refs += [
        f'\t\t{assets} /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; }};',
        f'\t\t{entitlements} /* HabitTracker.entitlements */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = HabitTracker.entitlements; sourceTree = "<group>"; }};',
        f'\t\t{widget_ent} /* HabitTrackerWidget.entitlements */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = HabitTrackerWidget.entitlements; sourceTree = "<group>"; }};',
        f'\t\t{privacy} /* PrivacyInfo.xcprivacy */ = {{isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; }};',
        f'\t\t{app_product} /* HabitTracker.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = HabitTracker.app; sourceTree = BUILT_PRODUCTS_DIR; }};',
        f'\t\t{widget_product} /* HabitTrackerWidget.appex */ = {{isa = PBXFileReference; explicitFileType = "wrapper.app-extension"; includeInIndex = 0; path = HabitTrackerWidget.appex; sourceTree = BUILT_PRODUCTS_DIR; }};',
        f'\t\t{health_fw} /* HealthKit.framework */ = {{isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = HealthKit.framework; path = System/Library/Frameworks/HealthKit.framework; sourceTree = SDKROOT; }};',
        f'\t\t{widget_fw} /* WidgetKit.framework */ = {{isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = WidgetKit.framework; path = System/Library/Frameworks/WidgetKit.framework; sourceTree = SDKROOT; }};',
    ]

    build_files = app_build + widget_build + [
        f"\t\t{health_link} /* HealthKit.framework in Frameworks */ = {{isa = PBXBuildFile; fileRef = {health_fw} /* HealthKit.framework */; }};",
        f"\t\t{widget_link_app} /* WidgetKit.framework in Frameworks */ = {{isa = PBXBuildFile; fileRef = {widget_fw} /* WidgetKit.framework */; }};",
        f"\t\t{widget_link_ext} /* WidgetKit.framework in Frameworks */ = {{isa = PBXBuildFile; fileRef = {widget_fw} /* WidgetKit.framework */; }};",
        f"\t\t{embed_widget} /* HabitTrackerWidget.appex in Embed Foundation Extensions */ = {{isa = PBXBuildFile; fileRef = {widget_product} /* HabitTrackerWidget.appex */; settings = {{ATTRIBUTES = (RemoveHeadersOnCopy, ); }}; }};",
    ]

    # Groups use folder-relative paths — keep a flat group pointing at real paths via name+path
    # Simpler: one group per directory with path set.
    def children(paths: list[str]) -> str:
        return "\n".join(f"\t\t\t\t{file_refs_by_path[p]} /* {Path(p).name} */," for p in paths)

    g_main = uid("group:main")
    g_app = uid("group:app")
    g_wid = uid("group:wid")
    g_shared = uid("group:shared")
    g_products = uid("group:products")
    g_fw = uid("group:fw")

    # File refs use path = filename only, so groups must have the directory path
    groups = f"""
		{g_main} = {{
			isa = PBXGroup;
			children = (
				{g_app} /* HabitTracker */,
				{g_wid} /* HabitTrackerWidget */,
				{g_shared} /* Shared */,
				{g_fw} /* Frameworks */,
				{g_products} /* Products */,
			);
			sourceTree = "<group>";
		}};
		{g_app} /* HabitTracker */ = {{
			isa = PBXGroup;
			children = (
{children([p for p in APP_SWIFT if p.startswith("HabitTracker/")])}
				{assets} /* Assets.xcassets */,
				{entitlements} /* HabitTracker.entitlements */,
				{privacy} /* PrivacyInfo.xcprivacy */,
			);
			path = HabitTracker;
			sourceTree = "<group>";
		}};
		{g_wid} /* HabitTrackerWidget */ = {{
			isa = PBXGroup;
			children = (
{children([p for p in WIDGET_SWIFT if p.startswith("HabitTrackerWidget/")])}
				{widget_ent} /* HabitTrackerWidget.entitlements */,
			);
			path = HabitTrackerWidget;
			sourceTree = "<group>";
		}};
		{g_shared} /* Shared */ = {{
			isa = PBXGroup;
			children = (
				{file_refs_by_path["Shared/WidgetSnapshot.swift"]} /* WidgetSnapshot.swift */,
			);
			path = Shared;
			sourceTree = "<group>";
		}};
		{g_products} /* Products */ = {{
			isa = PBXGroup;
			children = (
				{app_product} /* HabitTracker.app */,
				{widget_product} /* HabitTrackerWidget.appex */,
			);
			name = Products;
			sourceTree = "<group>";
		}};
		{g_fw} /* Frameworks */ = {{
			isa = PBXGroup;
			children = (
				{health_fw} /* HealthKit.framework */,
				{widget_fw} /* WidgetKit.framework */,
			);
			name = Frameworks;
			sourceTree = "<group>";
		}};
"""

    # Nested files under HabitTracker/ have path = filename only — WRONG for nested dirs
    # Fix: file refs should use last path component AND groups should nest, OR use full relative path from group.
    # Easiest fix: set each fileRef path to the path relative to its group.
    # HabitTracker group path = HabitTracker, so file path should be Config/AppConfig.swift etc.

    # Regenerate file refs with correct relative paths from their group
    # I'll rewrite refs properly below instead of the broken filename-only approach.

    print("NOTE: rewriting refs with group-relative paths in the final emit")

    # Actually I'll emit file refs with full path from project root and sourceTree = "<group>"
    # with groups that have no path, children use full relative path.

    refs = []
    file_refs_by_path = {}
    app_build = []
    widget_build = []

    all_paths = list(dict.fromkeys(APP_SWIFT + WIDGET_SWIFT))
    for path in all_paths:
        i = uid("ref:" + path)
        file_refs_by_path[path] = i
        refs.append(
            f'\t\t{i} /* {path} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {path}; sourceTree = "<group>"; }};'
        )
    for path in APP_SWIFT:
        b = uid("build-app:" + path)
        i = file_refs_by_path[path]
        app_build.append(
            f"\t\t{b} /* {path} in Sources */ = {{isa = PBXBuildFile; fileRef = {i} /* {path} */; }};"
        )
    for path in WIDGET_SWIFT:
        b = uid("build-wid:" + path)
        i = file_refs_by_path[path]
        widget_build.append(
            f"\t\t{b} /* {path} in Sources */ = {{isa = PBXBuildFile; fileRef = {i} /* {path} */; }};"
        )

    refs += [
        f'\t\t{assets} /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = HabitTracker/Assets.xcassets; sourceTree = "<group>"; }};',
        f'\t\t{entitlements} /* HabitTracker.entitlements */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = HabitTracker/HabitTracker.entitlements; sourceTree = "<group>"; }};',
        f'\t\t{widget_ent} /* HabitTrackerWidget.entitlements */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = HabitTrackerWidget/HabitTrackerWidget.entitlements; sourceTree = "<group>"; }};',
        f'\t\t{privacy} /* PrivacyInfo.xcprivacy */ = {{isa = PBXFileReference; lastKnownFileType = text.xml; path = HabitTracker/PrivacyInfo.xcprivacy; sourceTree = "<group>"; }};',
        f'\t\t{app_product} /* HabitTracker.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = HabitTracker.app; sourceTree = BUILT_PRODUCTS_DIR; }};',
        f'\t\t{widget_product} /* HabitTrackerWidget.appex */ = {{isa = PBXFileReference; explicitFileType = "wrapper.app-extension"; includeInIndex = 0; path = HabitTrackerWidget.appex; sourceTree = BUILT_PRODUCTS_DIR; }};',
        f'\t\t{health_fw} /* HealthKit.framework */ = {{isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = HealthKit.framework; path = System/Library/Frameworks/HealthKit.framework; sourceTree = SDKROOT; }};',
        f'\t\t{widget_fw} /* WidgetKit.framework */ = {{isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = WidgetKit.framework; path = System/Library/Frameworks/WidgetKit.framework; sourceTree = SDKROOT; }};',
    ]

    build_files = app_build + widget_build + [
        f"\t\t{health_link} /* HealthKit.framework in Frameworks */ = {{isa = PBXBuildFile; fileRef = {health_fw} /* HealthKit.framework */; }};",
        f"\t\t{widget_link_app} /* WidgetKit.framework in Frameworks */ = {{isa = PBXBuildFile; fileRef = {widget_fw} /* WidgetKit.framework */; }};",
        f"\t\t{widget_link_ext} /* WidgetKit.framework in Frameworks */ = {{isa = PBXBuildFile; fileRef = {widget_fw} /* WidgetKit.framework */; }};",
        f"\t\t{embed_widget} /* HabitTrackerWidget.appex in Embed Foundation Extensions */ = {{isa = PBXBuildFile; fileRef = {widget_product} /* HabitTrackerWidget.appex */; settings = {{ATTRIBUTES = (RemoveHeadersOnCopy, ); }}; }};",
        f"\t\t{assets_build} /* Assets.xcassets in Resources */ = {{isa = PBXBuildFile; fileRef = {assets} /* Assets.xcassets */; }};",
    ]

    src_app = uid("phase:src-app")
    src_wid = uid("phase:src-wid")
    fw_app = uid("phase:fw-app")
    fw_wid = uid("phase:fw-wid")
    res_app = uid("phase:res-app")
    embed = uid("phase:embed")
    target_app = uid("target:app")
    target_wid = uid("target:wid")
    conf_list_app = uid("conflist:app")
    conf_list_wid = uid("conflist:wid")
    conf_list_proj = uid("conflist:proj")
    conf_app_d = uid("conf:app-d")
    conf_app_r = uid("conf:app-r")
    conf_wid_d = uid("conf:wid-d")
    conf_wid_r = uid("conf:wid-r")
    conf_proj_d = uid("conf:proj-d")
    conf_proj_r = uid("conf:proj-r")
    proj = uid("project")

    app_src_children = "\n".join(
        f"\t\t\t\t{uid('build-app:' + p)} /* {p} in Sources */," for p in APP_SWIFT
    )
    wid_src_children = "\n".join(
        f"\t\t\t\t{uid('build-wid:' + p)} /* {p} in Sources */," for p in WIDGET_SWIFT
    )
    all_file_children = "\n".join(
        f"\t\t\t\t{file_refs_by_path[p]} /* {p} */," for p in all_paths
    )

    groups = f"""
		{g_main} = {{
			isa = PBXGroup;
			children = (
{all_file_children}
				{assets} /* Assets.xcassets */,
				{entitlements} /* HabitTracker.entitlements */,
				{widget_ent} /* HabitTrackerWidget.entitlements */,
				{privacy} /* PrivacyInfo.xcprivacy */,
				{g_fw} /* Frameworks */,
				{g_products} /* Products */,
			);
			sourceTree = "<group>";
		}};
		{g_products} /* Products */ = {{
			isa = PBXGroup;
			children = (
				{app_product} /* HabitTracker.app */,
				{widget_product} /* HabitTrackerWidget.appex */,
			);
			name = Products;
			sourceTree = "<group>";
		}};
		{g_fw} /* Frameworks */ = {{
			isa = PBXGroup;
			children = (
				{health_fw} /* HealthKit.framework */,
				{widget_fw} /* WidgetKit.framework */,
			);
			name = Frameworks;
			sourceTree = "<group>";
		}};
"""

    common_flags = """
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				ENABLE_USER_SCRIPT_SANDBOXING = YES;
				GCC_NO_COMMON_BLOCKS = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 18.0;
				SDKROOT = iphoneos;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
"""

    info_keys = """
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				GENERATE_INFOPLIST_FILE = YES;
				INFOPLIST_FILE = HabitTracker/Info.plist;
				INFOPLIST_KEY_CFBundleDisplayName = "Habit Tracker";
				INFOPLIST_KEY_LSApplicationCategoryType = "public.app-category.healthcare-fitness";
				INFOPLIST_KEY_NSCameraUsageDescription = "Take a photo of a meal so we can estimate protein and extras. You can always type it instead.";
				INFOPLIST_KEY_NSHealthShareUsageDescription = "Habit Tracker reads steps, exercise minutes, workouts, mindful minutes, last night's sleep, and weight from Apple Health so Move Body, Mindful Minutes, and Restful Sleep can fill themselves in. This is a coaching tool, not medical advice. We do not sell Health data.";
				INFOPLIST_KEY_NSHealthUpdateUsageDescription = "When you log a walk, workout, or mindful minutes in Habit Tracker, we save that session to Apple Health so your rings and Mindfulness stay in sync. We never sell Health data.";
				INFOPLIST_KEY_NSPhotoLibraryUsageDescription = "Attach an existing meal photo if you prefer not to use the camera.";
				INFOPLIST_KEY_UILaunchScreen_Generation = YES;
				INFOPLIST_KEY_UISupportedInterfaceOrientations = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
				INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
"""

    pbx = f"""// !$*UTF8*$!
{{
	archiveVersion = 1;
	classes = {{
	}};
	objectVersion = 56;
	objects = {{

/* Begin PBXBuildFile section */
{chr(10).join(build_files)}
/* End PBXBuildFile section */

/* Begin PBXCopyFilesBuildPhase section */
		{embed} /* Embed Foundation Extensions */ = {{
			isa = PBXCopyFilesBuildPhase;
			buildActionMask = 2147483647;
			dstPath = "";
			dstSubfolderSpec = 13;
			files = (
				{embed_widget} /* HabitTrackerWidget.appex in Embed Foundation Extensions */,
			);
			name = "Embed Foundation Extensions";
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXCopyFilesBuildPhase section */

/* Begin PBXFileReference section */
{chr(10).join(refs)}
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
		{fw_app} /* Frameworks */ = {{
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
				{health_link} /* HealthKit.framework in Frameworks */,
				{widget_link_app} /* WidgetKit.framework in Frameworks */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
		{fw_wid} /* Frameworks */ = {{
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
				{widget_link_ext} /* WidgetKit.framework in Frameworks */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
{groups}
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		{target_app} /* HabitTracker */ = {{
			isa = PBXNativeTarget;
			buildConfigurationList = {conf_list_app} /* Build configuration list for PBXNativeTarget "HabitTracker" */;
			buildPhases = (
				{src_app} /* Sources */,
				{fw_app} /* Frameworks */,
				{res_app} /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = HabitTracker;
			productName = HabitTracker;
			productReference = {app_product} /* HabitTracker.app */;
			productType = "com.apple.product-type.application";
		}};
		{target_wid} /* HabitTrackerWidget */ = {{
			isa = PBXNativeTarget;
			buildConfigurationList = {conf_list_wid} /* Build configuration list for PBXNativeTarget "HabitTrackerWidget" */;
			buildPhases = (
				{src_wid} /* Sources */,
				{fw_wid} /* Frameworks */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = HabitTrackerWidget;
			productName = HabitTrackerWidget;
			productReference = {widget_product} /* HabitTrackerWidget.appex */;
			productType = "com.apple.product-type.app-extension";
		}};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		{proj} /* Project object */ = {{
			isa = PBXProject;
			attributes = {{
				BuildIndependentTargetsInParallel = 1;
				LastSwiftUpdateCheck = 1600;
				LastUpgradeCheck = 1600;
			}};
			buildConfigurationList = {conf_list_proj} /* Build configuration list for PBXProject "HabitTracker" */;
			compatibilityVersion = "Xcode 14.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = {g_main};
			productRefGroup = {g_products};
			projectDirPath = "";
			projectRoot = "";
			targets = (
				{target_app} /* HabitTracker */,
				{target_wid} /* HabitTrackerWidget */,
			);
		}};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		{res_app} /* Resources */ = {{
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				{assets_build} /* Assets.xcassets in Resources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		{src_app} /* Sources */ = {{
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
{app_src_children}
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
		{src_wid} /* Sources */ = {{
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
{wid_src_children}
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
		{conf_proj_d} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
{common_flags}
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_TESTABILITY = YES;
				MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
				ONLY_ACTIVE_ARCH = YES;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
			}};
			name = Debug;
		}};
		{conf_proj_r} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
{common_flags}
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				MTL_ENABLE_DEBUG_INFO = NO;
				SWIFT_COMPILATION_MODE = wholemodule;
				SWIFT_OPTIMIZATION_LEVEL = "-O";
				VALIDATE_PRODUCT = YES;
			}};
			name = Release;
		}};
		{conf_app_d} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				CODE_SIGN_ENTITLEMENTS = HabitTracker/HabitTracker.entitlements;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
{info_keys}
				LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.mindandbodyreset.habittracker;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SUPPORTS_MACCATALYST = NO;
				SWIFT_EMIT_LOC_STRINGS = YES;
			}};
			name = Debug;
		}};
		{conf_app_r} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				CODE_SIGN_ENTITLEMENTS = HabitTracker/HabitTracker.entitlements;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
{info_keys}
				LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.mindandbodyreset.habittracker;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SUPPORTS_MACCATALYST = NO;
				SWIFT_EMIT_LOC_STRINGS = YES;
			}};
			name = Release;
		}};
		{conf_wid_d} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				APPLICATION_EXTENSION_API_ONLY = YES;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = YES;
				INFOPLIST_KEY_CFBundleDisplayName = "Today";
				INFOPLIST_KEY_NSExtension_NSExtensionPointIdentifier = "com.apple.widgetkit-extension";
				INFOPLIST_KEY_NSHumanReadableCopyright = "";
				LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks";
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.mindandbodyreset.habittracker.widget;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SKIP_INSTALL = YES;
				SWIFT_EMIT_LOC_STRINGS = YES;
			}};
			name = Debug;
		}};
		{conf_wid_r} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				APPLICATION_EXTENSION_API_ONLY = YES;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = YES;
				INFOPLIST_KEY_CFBundleDisplayName = "Today";
				INFOPLIST_KEY_NSExtension_NSExtensionPointIdentifier = "com.apple.widgetkit-extension";
				INFOPLIST_KEY_NSHumanReadableCopyright = "";
				LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks";
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.mindandbodyreset.habittracker.widget;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SKIP_INSTALL = YES;
				SWIFT_EMIT_LOC_STRINGS = YES;
			}};
			name = Release;
		}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		{conf_list_proj} /* Build configuration list for PBXProject "HabitTracker" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{conf_proj_d} /* Debug */,
				{conf_proj_r} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
		{conf_list_app} /* Build configuration list for PBXNativeTarget "HabitTracker" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{conf_app_d} /* Debug */,
				{conf_app_r} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
		{conf_list_wid} /* Build configuration list for PBXNativeTarget "HabitTrackerWidget" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{conf_wid_d} /* Debug */,
				{conf_wid_r} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
/* End XCConfigurationList section */
	}};
	rootObject = {proj} /* Project object */;
}}
"""

    out = ROOT / "HabitTracker.xcodeproj" / "project.pbxproj"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(pbx, encoding="utf-8")
    print("Wrote", out)


if __name__ == "__main__":
    main()
