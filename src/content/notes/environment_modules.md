---
title: 'Environment modules'
description: 'environment modules on HPC systems'
pubDate: 'Jul 20 2024'
---

I recently turned an old laptop into a home Fedora Linux server. I wanted to see if I could install the tools I regularly use on clusters on it, specifically OpenMPI with an Intel Fortran compiler. I was successful in setting this up and was able to run a parallel MPI job on the 4 cores it had, but then I wondered how clusters are able to make it as simple as loading the modules for the required packages. This led me to learning about how environment modules worked on HPC systems, so I tried to install it on my home server and use it. In this post, I describe my experience setting up `environment-modules` on my home server.

## environment-modules
The ```environment-modules``` package allows users of the server to use commands like ```module load module_x``` to modify their environments so that the ```PATH``` and other variables like ```LIBRARY_PATH``` are set so programs and compilers like ```mpifort, ifort``` can be used. It allows high levels of modularity, including versions of different packages. 

The goal is to allow users to log in to the server with a fresh environment set by their ```.bash_profile``` and ```.bashrc``` files, and allow them to load modules when needed, and even unload them when they're done with them. This way, user's ```PATH``` variables are not swamped with all sorts of different unnecessary paths. 

### Installation
To install `environment-modules`, use the command
```
sudo dnf install environment-modules
```

To verify installation, we can use the `rpm` package:
```
rpm -ql environment-modules | grep module
```

The first part lists all the files installed by the `environment-modules` package. The `q` flag stands for "query" and the `l` flag stands for "list". Together, they provide a list of files installed by a specified package. 

The second part searches for a specific pattern (in this case, "module") within the input it receives. In this case, we use the `|` ("pipe") symbol to take the output of the first part and pass it as input to `grep`.

So the total command lists the files installed by the package. This command should list all the different files that were installed. 

We now look for an `/init/bash` file, but it does not exist anywhere. However, we did find `README` and `INSTALL.txt` files in `/usr/share/doc/environment-modules/`. The instructions then tell us to manually install the `modules` package from the source:
```
curl -LJO https://github.com/cea-hpc/modules/releases/download/v5.4.0/modules-5.4.0.tar.gz
tar xfz modules-5.4.0.tar.gz
```

This downloads the `modules` package from github and extracts it to the working directory. It then states that the simplest way to build and install it is by going into the `/modules` directory and running:
```
./configure
make
make install
```

The `./configure`  runs the executable and ensures the prerequisite tools are installed. The package is then installed in the `/modules` directory, but you can specify where you want it installed by using the `--prefix` flags. I just ended up moving the entire `/modules` directory to `/usr/share/modules`.

Now all that's left is to add the following lines in your `.bashrc`:
```
source /usr/share/modules/init/bash
module use ~/modules
```

### Using modules

A systems admin can put modulefiles in that directory for all users to use. For a custom user-defined module, we can make a `modules` directory in our user root directory and add custom modulefiles for each package we want to use.

For example, to include the `openmpi` package, we make a modulefile `~/modules/openmpi/4.1.5`:

```
#%Module
proc ModulesHelp { } {
    puts stderr "Sets up environment for OpenMPI and Intel Fortran Compiler"
}

module-whatis "Sets up environment for OpenMPI and Intel Fortran Compiler"

# Load Intel Fortran Compiler
module load intel-oneapi

# Set up OpenMPI
set basedir "/usr/lib64/openmpi"
prepend-path PATH "${basedir}/bin"
prepend-path LD_LIBRARY_PATH "${basedir}/lib"
```

We name the modulefile the version of the package we have installed.
Notice we can also load other modules from inside this modulefile! The line `module load intel-oneapi` simply activates the environment based on the modulefile inside the `~/modules/intel-oneapi/` directory.

It was a bit more tricky to get a modulefile for the `intel-oneapi` package though. To set up your environment the `intel-oneapi` package, you have to run a bash script from `/opt/intel/oneapi/setvars.sh`. We can't just add a line to run the script from inside the modulefile. However, the `modules` package has a simple tool called `sh-to-mod` that creates the modulefile for you as if you did run the bash script. Simply run:
```
module sh-to-mod bash /opt/intel/oneapi/setvars.sh > 2024.2
```

Here we're taking the output of `sh-to-mod`, which is a modulefile, and putting it in a file called `2024.2`, which is the version of the `intel-oneapi` package I installed.

We just now have to run `module load openmpi` to load `openmpi` when logging into the server. This also loads the `intel-oneapi` dependency since we need the Intel Fortran compiler too. Doing so, we get:
```
$ module load openmpi
Loading openmpi/4.1.5
  Loading requirement: intel-oneapi/2024.2
```

We can then then use the OpenMPI library with the Intel Fortran compilers for our calculations!

### Module commands

- List modules: `module avail`
- Loading modules: `module load <package>`
- Unloading modules: `module purge`