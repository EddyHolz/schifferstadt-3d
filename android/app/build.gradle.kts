plugins { id("com.android.application") }
android {
    namespace = "de.schifferstadt.explore"
    compileSdk = 35
    defaultConfig {
        applicationId = "de.schifferstadt.explore"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }
    sourceSets.getByName("main").assets.srcDir("../../dist")
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

val verifyCityAssets by tasks.registering {
    doLast {
        val dist = project.file("../../dist")
        val required = listOf("index.html", "app.js", "app.css", "engine.js", "vendor/THREE-LICENSE.txt")
        check(required.all { dist.resolve(it).isFile && dist.resolve(it).length() > 0 }) {
            "Bundled app files missing from dist/. Restore the complete web app and Three.js license before building."
        }
        val three = dist.resolve("vendor/three.module.js")
        val city = dist.resolve("data/city.json")
        check(three.isFile && three.length() > 100000 && city.isFile && city.length() > 1000) {
            "Offline assets missing. Run python3 ../tools/prepare-assets.py from android/ before building."
        }
    }
}
tasks.named("preBuild").configure { dependsOn(verifyCityAssets) }
