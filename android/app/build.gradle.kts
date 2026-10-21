plugins { id("com.android.application") }
android {
    namespace = "de.schifferstadt.sops"
    compileSdk = 35
    defaultConfig {
        applicationId = "de.schifferstadt.sops"
        minSdk = 26
        targetSdk = 35
        versionCode = 3
        versionName = "0.3.0-dev"
    }
    sourceSets.getByName("main").assets.srcDir("../../dist")
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

val verifyGameAssets by tasks.registering {
    doLast {
        val dist = project.file("../../dist")
        val required = listOf("index.html", "app.js", "app.css", "fps-engine.js", "maps.js", "vendor/THREE-LICENSE.txt")
        check(required.all { dist.resolve(it).isFile && dist.resolve(it).length() > 0 }) {
            "Game assets incomplete. Restore dist/ and run python3 ../tools/prepare-assets.py."
        }
        check(dist.resolve("vendor/three.module.js").length() > 100000) {
            "Three.js missing. Run python3 ../tools/prepare-assets.py before building."
        }
    }
}
tasks.named("preBuild").configure { dependsOn(verifyGameAssets) }
